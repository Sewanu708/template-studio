import React, { useState, useRef, useEffect } from 'react';
import type { Component, Editor } from 'grapesjs';
import type { AgentScope, MentionedAsset, PreparedAgentMutation } from '../../editor/ai/agent-types';
import { buildAgentRequest } from '../../editor/ai/agent-context';
import { callEmailAgent } from '../../editor/ai/agent-client';
import { validateAndPrepareAgentResponse } from '../../editor/ai/agent-validation';
import { applyAgentMutation } from '../../editor/ai/agent-apply';
import { applyTextSelectionResponse } from '../../editor/ai/agent-apply-text-selection';
import { lockAgentTarget } from '../../editor/ai/agent-locks';
import {
  captureActiveTextSelection,
  type CapturedTextSelection,
} from '../../editor/ai/text-selection-context';
import {
  getAvailableAssets,
  detectMentionQuery,
  insertMentionIntoText,
  type MentionMatch,
} from '../../editor/ai/image-mentions';
import { ImageMentionMenu } from './image-mention-menu';

export interface FloatingAiChatProps {
  editor: Editor;
  open: boolean;
  scope: AgentScope;
  target: Component;
  initialTextSelection?: CapturedTextSelection | null;
  onClose: () => void;
  onUndoAvailable?: (undoFn: () => void) => void;
}

export const FloatingAiChat: React.FC<FloatingAiChatProps> = ({
  editor,
  open,
  scope,
  target,
  initialTextSelection,
  onClose,
  onUndoAvailable,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnswer, setLastAnswer] = useState<{ summary: string; message: string } | null>(null);
  const [lastMutationSummary, setLastMutationSummary] = useState<string | null>(null);

  // Asset mentions
  const [mentionedAssets, setMentionedAssets] = useState<MentionedAsset[]>([]);
  const [activeMentionMatch, setActiveMentionMatch] = useState<MentionMatch | null>(null);
  const [availableAssets, setAvailableAssets] = useState<MentionedAsset[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const targetType = String(target.get('type') ?? target.get('tagName') ?? 'element');
  const targetId = target.getId();

  // Load available assets from AssetManager on open
  useEffect(() => {
    if (open && editor) {
      const assets = getAvailableAssets(editor);
      setAvailableAssets(assets);
      textareaRef.current?.focus();
    }
  }, [open, editor]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  if (!open) return null;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPrompt(val);
    setError(null);

    const cursorPos = e.target.selectionStart ?? val.length;
    const match = detectMentionQuery(val, cursorPos);
    setActiveMentionMatch(match);
  };

  const handleSelectAsset = (asset: MentionedAsset) => {
    if (!activeMentionMatch) return;

    const { nextText, nextCursorPos } = insertMentionIntoText(
      prompt,
      activeMentionMatch,
      asset,
    );

    setPrompt(nextText);
    setActiveMentionMatch(null);

    // Track mentioned assets
    if (!mentionedAssets.some((a) => a.id === asset.id || a.url === asset.url)) {
      setMentionedAssets((prev) => [...prev, asset]);
    }

    // Restore cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextCursorPos, nextCursorPos);
      }
    }, 0);
  };

  const handleRemoveMention = (assetId: string) => {
    setMentionedAssets((prev) => prev.filter((a) => a.id !== assetId));
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setError(null);
    setLastAnswer(null);
    setLastMutationSummary(null);
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 1. Lock the selected target
    const unlockTarget = lockAgentTarget(target);

    try {
      const capturedTextSelection = scope === 'text-selection'
        ? initialTextSelection ?? captureActiveTextSelection(editor)
        : undefined;

      if (scope === 'text-selection' && !capturedTextSelection) {
        throw new Error('No valid text selection is active. Select text inside an mj-text or mj-button before using AI selection mode.');
      }

      // 2. Build request context
      const request = buildAgentRequest({
        editor,
        scope,
        target,
        prompt: prompt.trim(),
        mentionedAssets,
        textSelection: capturedTextSelection?.context ?? null,
      });

      // 3. Call AI endpoint
      const rawResponse = await callEmailAgent(request, {
        signal: controller.signal,
      });

      // 4. Validate & compile candidate response
      const prepared = validateAndPrepareAgentResponse({
        raw: rawResponse,
        request,
        editor,
      });

      if ('type' in prepared && prepared.type === 'answer') {
        setLastAnswer({
          summary: prepared.summary,
          message: prepared.message,
        });
      } else if (request.scope === 'text-selection') {
        const preparedSelection = prepared as {
          response: { type: 'replace-text-selection'; targetId: string; summary: string; explanation?: string; replacementHtml: string };
          normalizedHtml: string;
        };

        if (!capturedTextSelection) {
          throw new Error('Selected text is no longer available. Select the text again and retry.');
        }

        const undo = applyTextSelectionResponse({
          editor,
          response: preparedSelection.response,
          capturedSelection: capturedTextSelection,
          normalizedHtml: preparedSelection.normalizedHtml,
        });

        if (typeof undo === 'function' && onUndoAvailable) {
          onUndoAvailable(undo);
        }

        setLastMutationSummary(preparedSelection.response.summary);
        setPrompt('');
        setMentionedAssets([]);
      } else {
        // 5. Auto-apply validated mutation
        const mutation = prepared as PreparedAgentMutation;
        applyAgentMutation({
          editor,
          request,
          mutation,
          onUndoAvailable,
        });

        setLastMutationSummary(mutation.response.summary);
        setPrompt('');
        setMentionedAssets([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      // Always unlock target
      unlockTarget();
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (activeMentionMatch) return; // Allow mention menu to handle keys
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={styles.floatingContainer}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.sparkleIcon}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
          </div>
          <span style={styles.title}>AI Assistant</span>
          <span style={styles.badge}>
            {scope}: {targetType}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={styles.closeBtn}
          title="Close AI Assistant"
        >
          ✕
        </button>
      </div>

      {/* Target Info Bar */}
      <div style={styles.targetBar}>
        Target ID: <code style={styles.idCode}>{targetId}</code>
      </div>

      {/* Answer Message Banner */}
      {lastAnswer && (
        <div style={styles.answerBox}>
          <div style={styles.answerSummary}>{lastAnswer.summary}</div>
          <div style={styles.answerMessage}>{lastAnswer.message}</div>
        </div>
      )}

      {/* Success Banner */}
      {lastMutationSummary && (
        <div style={styles.successBox}>
          <div style={styles.successIcon}>✓</div>
          <div>
            <strong>Applied:</strong> {lastMutationSummary}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div style={styles.errorBox}>
          <div style={styles.errorHeader}>
            <span>Error</span>
            <button
              type="button"
              onClick={() => setError(null)}
              style={styles.dismissErrorBtn}
            >
              ✕
            </button>
          </div>
          <div style={styles.errorMessage}>{error}</div>
        </div>
      )}

      {/* Mention Chips */}
      {mentionedAssets.length > 0 && (
        <div style={styles.chipsContainer}>
          <span style={styles.chipsLabel}>Assets:</span>
          {mentionedAssets.map((asset) => (
            <span key={asset.id} style={styles.chip}>
              @{asset.name}
              <button
                type="button"
                onClick={() => handleRemoveMention(asset.id)}
                style={styles.removeChipBtn}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.textareaWrapper}>
          {activeMentionMatch && (
            <ImageMentionMenu
              assets={availableAssets}
              query={activeMentionMatch.query}
              onSelect={handleSelectAsset}
              onClose={() => setActiveMentionMatch(null)}
            />
          )}
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={`Instruct AI to edit this ${scope} (e.g. "make headline catchier", type @ for images)...`}
            rows={3}
            style={styles.textarea}
          />
        </div>

        <div style={styles.footer}>
          <div style={styles.hint}>
            Press <kbd style={styles.kbd}>Enter</kbd> to apply, <kbd style={styles.kbd}>@</kbd> for images
          </div>

          <div style={styles.actions}>
            {isLoading ? (
              <button
                type="button"
                onClick={handleCancel}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
            ) : null}

            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              style={{
                ...styles.sendBtn,
                opacity: isLoading || !prompt.trim() ? 0.6 : 1,
                cursor: isLoading || !prompt.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? (
                <>
                  <div style={styles.btnSpinner} />
                  <span>Applying...</span>
                </>
              ) : (
                'Generate & Apply'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  floatingContainer: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 480,
    maxWidth: 'calc(100% - 32px)',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    border: '1px solid #e5e7eb',
    boxShadow:
      '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #f3f4f6',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  sparkleIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#e0e7ff',
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    color: '#111827',
  },
  badge: {
    fontSize: 11,
    fontWeight: 500,
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    padding: '2px 8px',
    borderRadius: 12,
    border: '1px solid #e5e7eb',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    fontSize: 14,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetBar: {
    padding: '6px 16px',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #f3f4f6',
    fontSize: 11,
    color: '#6b7280',
  },
  idCode: {
    backgroundColor: '#eef2ff',
    color: '#4338ca',
    padding: '1px 4px',
    borderRadius: 3,
    fontFamily: 'monospace',
  },
  answerBox: {
    margin: '12px 16px 0',
    padding: '10px 12px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 13,
    color: '#334155',
  },
  answerSummary: {
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: 4,
  },
  answerMessage: {
    lineHeight: 1.45,
  },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: '12px 16px 0',
    padding: '8px 12px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 8,
    color: '#15803d',
    fontSize: 12,
  },
  successIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorBox: {
    margin: '12px 16px 0',
    padding: '10px 12px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    color: '#b91c1c',
  },
  errorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 12,
    lineHeight: 1.4,
    wordBreak: 'break-word',
  },
  dismissErrorBtn: {
    background: 'none',
    border: 'none',
    color: '#b91c1c',
    cursor: 'pointer',
    fontSize: 12,
  },
  chipsContainer: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    padding: '8px 16px 0',
  },
  chipsLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: 500,
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ede9fe',
    color: '#6d28d9',
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 12,
    fontWeight: 500,
  },
  removeChipBtn: {
    background: 'none',
    border: 'none',
    color: '#6d28d9',
    cursor: 'pointer',
    fontSize: 10,
    padding: 0,
    lineHeight: 1,
  },
  form: {
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  textareaWrapper: {
    position: 'relative',
    width: '100%',
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 13,
    fontFamily: 'inherit',
    lineHeight: 1.4,
    resize: 'none',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hint: {
    fontSize: 11,
    color: '#9ca3af',
  },
  kbd: {
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: 3,
    padding: '1px 4px',
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#4b5563',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  cancelBtn: {
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    color: '#4b5563',
    padding: '7px 12px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
  },
  sendBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366f1',
    border: 'none',
    color: '#ffffff',
    padding: '7px 14px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  btnSpinner: {
    width: 12,
    height: 12,
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
  },
};
