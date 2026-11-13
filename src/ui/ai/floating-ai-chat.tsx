import React, { useState, useRef, useEffect } from 'react';
import type { Component, Editor } from 'grapesjs';
import type {
  AgentScope,
  AgentSession,
  ConversationMessage,
  MentionedAsset,
  PreparedAgentMutation,
} from '../../editor/ai/agent-types';
import {
  getOrCreateSession,
  addMessageToSession,
  saveSession,
  clearSession,
} from '../../editor/ai/agent-session';
import { buildAgentRequest, buildTemplateAgentRequest } from '../../editor/ai/agent-context';
import { DEFAULT_GEMINI_MODEL } from '../../editor/ai/agent-client';
import {
  callAndPrepareAgentResponseWithRepair,
  type AgentCallResult,
} from '../../editor/ai/agent-call-with-repair';
import { applyAgentMutation, applyTemplateReplacement } from '../../editor/ai/agent-apply';
import { applyTextSelectionResponse } from '../../editor/ai/agent-apply-text-selection';
import { lockAgentTarget, lockEntireCanvas } from '../../editor/ai/agent-locks';
import { buildCanvasSummary } from '../../editor/ai/canvas-summary';
import { getSessionForRequest } from '../../editor/ai/agent-session';
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
import {
  ACCEPTED_IMAGE_TYPES,
  uploadImageAsset,
} from '../../services/assets/upload';
import { ImageMentionMenu } from './image-mention-menu';

const AI_SETTINGS_STORAGE_KEY = 'template-builder-ai-settings';

interface StoredAiSettings {
  apiKey?: string;
  model?: string;
}

function loadAiSettings(): StoredAiSettings {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAiSettings) : {};
  } catch {
    return {};
  }
}

function saveAiSettings(settings: StoredAiSettings): void {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(
    AI_SETTINGS_STORAGE_KEY,
    JSON.stringify(settings),
  );
}

export interface FloatingAiChatProps {
  editor: Editor;
  open: boolean;
  scope: AgentScope;
  /** Target component - required for component/section/text-selection scopes, optional for template scope */
  target?: Component | null;
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
  const [currentTarget, setCurrentTarget] = useState<Component | null>(
    target ?? null,
  );
  const [aiSettings, setAiSettings] = useState<StoredAiSettings>(() =>
    loadAiSettings(),
  );
  const [showAiSettings, setShowAiSettings] = useState(
    () => !loadAiSettings().apiKey,
  );

  // Session / conversation history
  const [session, setSession] = useState<AgentSession>(() => getOrCreateSession());

  // Asset mentions
  const [mentionedAssets, setMentionedAssets] = useState<MentionedAsset[]>([]);
  const [activeMentionMatch, setActiveMentionMatch] = useState<MentionMatch | null>(null);
  const [availableAssets, setAvailableAssets] = useState<MentionedAsset[]>([]);
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load available assets from AssetManager on open
  useEffect(() => {
    if (open && editor) {
      const assets = getAvailableAssets(editor);
      setAvailableAssets(assets);
      textareaRef.current?.focus();
    }
  }, [open, editor]);

  // Reload session from localStorage when chat opens (in case it changed elsewhere)
  useEffect(() => {
    if (open) {
      setSession(getOrCreateSession());
      setCurrentTarget(target ?? null);
    }
  }, [open, target]);

  // Persist session whenever it changes
  useEffect(() => {
    saveSession(session);
  }, [session]);

  // Persist AI settings locally. This replaces build-time .env configuration.
  useEffect(() => {
    saveAiSettings({
      apiKey: aiSettings.apiKey ?? '',
      model: aiSettings.model?.trim() || DEFAULT_GEMINI_MODEL,
    });
  }, [aiSettings]);

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

  const appendAssetMention = (asset: MentionedAsset) => {
    const mentionTag = `@${asset.name}`;
    const separator = prompt.trim().length > 0 && !/\s$/.test(prompt) ? ' ' : '';
    const nextText = `${prompt}${separator}${mentionTag} `;

    setPrompt(nextText);
    setActiveMentionMatch(null);

    if (!mentionedAssets.some((a) => a.id === asset.id || a.url === asset.url)) {
      setMentionedAssets((prev) => [...prev, asset]);
    }

    setTimeout(() => {
      if (textareaRef.current) {
        const nextCursorPos = nextText.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextCursorPos, nextCursorPos);
      }
    }, 0);
  };

  const handleUploadAssetClick = () => {
    if (isLoading || isUploadingAsset) return;
    fileInputRef.current?.click();
  };

  const handleUploadAsset = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    setError(null);
    setIsUploadingAsset(true);

    try {
      const { url, fileName, mimeType } = await uploadImageAsset(file);
      const assetModel = editor.AssetManager.add({
        src: url,
        name: fileName,
        type: 'image',
        mimeType,
      });

      const asset: MentionedAsset = {
        id: String(
          (assetModel as unknown as { get?: (key: string) => unknown; cid?: string }).get?.('id') ??
            (assetModel as unknown as { cid?: string }).cid ??
            url,
        ),
        name: fileName,
        url,
        mimeType,
      };

      setAvailableAssets(getAvailableAssets(editor));
      appendAssetMention(asset);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsUploadingAsset(false);
    }
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

  const handleNewChat = () => {
    clearSession();
    setSession(getOrCreateSession());
    setPrompt('');
    setMentionedAssets([]);
    setError(null);
  };

  const isComponentInCanvas = (component: Component | null | undefined) => {
    if (!component) return false;
    const id = component.getId();

    return Boolean(id && editor.Components.getById(id));
  };

  const getSelectedSection = (): Component | null => {
    const selected = editor.getSelected();
    if (!selected) return null;

    if (selected.is('mj-section')) return selected;

    let current: Component | undefined = selected.parent();
    while (current) {
      if (current.is('mj-section')) return current;
      current = current.parent();
    }

    return null;
  };

  const resolveCurrentTarget = (): Component | null => {
    if (scope === 'template') return null;
    if (isComponentInCanvas(currentTarget)) return currentTarget;

    const selected = editor.getSelected();
    if (scope === 'section') {
      return getSelectedSection();
    }

    if (
      selected
      && scope === 'component'
      && isComponentInCanvas(selected)
      && !selected.is('mj-section')
      && !selected.is('mj-column')
      && !selected.is('mj-group')
    ) {
      return selected;
    }

    return null;
  };

  // Helper to get target info for messages
  const getTargetType = () =>
    currentTarget
      ? String(currentTarget.get('type') ?? currentTarget.get('tagName') ?? 'element')
      : 'template';
  const getTargetId = () => currentTarget?.getId() ?? 'entire-template';

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const apiKey = aiSettings.apiKey?.trim() ?? '';
    const model = aiSettings.model?.trim() || DEFAULT_GEMINI_MODEL;

    if (!apiKey) {
      setShowAiSettings(true);
      setError('Enter your Gemini API key before using AI.');
      return;
    }

    setError(null);
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    let unlockTarget = () => {};

    try {
      const activeTarget = resolveCurrentTarget();
      setCurrentTarget(activeTarget);

      // Validate target for non-template scopes
      if (scope !== 'template' && !activeTarget) {
        throw new Error(
          `The selected ${scope} is no longer available. Select the section/component again and retry.`,
        );
      }

      // 1. Lock the selected target or entire canvas for template scope
      unlockTarget = scope === 'template'
        ? lockEntireCanvas(editor)
        : activeTarget
          ? lockAgentTarget(activeTarget)
          : () => {};

      const capturedTextSelection = scope === 'text-selection'
        ? initialTextSelection ?? captureActiveTextSelection(editor)
        : undefined;

      if (scope === 'text-selection' && !capturedTextSelection) {
        throw new Error('No valid text selection is active. Select text inside an mj-text or mj-button before using AI selection mode.');
      }

      // 2. Add user message to session
      const userMessage: Omit<ConversationMessage, 'id' | 'timestamp'> = {
        role: 'user',
        content: prompt.trim(),
        scope,
        targetId: getTargetId(),
        targetType: getTargetType(),
      };
      const updatedSession = addMessageToSession(session, userMessage);
      setSession(updatedSession);

      // 3. Build request context based on scope
      const { sessionContext, conversationHistory } = getSessionForRequest(updatedSession);
      const canvasSummary = buildCanvasSummary(editor);

      const request = scope === 'template'
        ? buildTemplateAgentRequest({
            editor,
            prompt: prompt.trim(),
            mentionedAssets,
            canvasSummary,
            sessionContext,
            conversationHistory: conversationHistory.slice(0, -1), // Exclude message we just added
          })
        : (() => {
            const req = buildAgentRequest({
              editor,
              scope,
              target: activeTarget!,
              prompt: prompt.trim(),
              mentionedAssets,
              textSelection: capturedTextSelection?.context ?? null,
            });
            // Add session context to non-template requests
            req.canvasSummary = canvasSummary;
            req.sessionContext = sessionContext;
            req.conversationHistory = conversationHistory.slice(0, -1);
            return req;
          })();

      // 4. Call AI endpoint with automatic repair retry
      const prepared: AgentCallResult = await callAndPrepareAgentResponseWithRepair({
        request,
        editor,
        signal: controller.signal,
        aiConfig: {
          apiKey,
          model,
        },
        onRepairAttempt: (info) => {
          console.log('[ai] repair retry triggered');
          console.log('[ai] repair reasons:', info.reasons);
        },
      });

      if ('type' in prepared && prepared.type === 'answer') {
        // Add assistant answer to session
        const answerMessage: Omit<ConversationMessage, 'id' | 'timestamp'> = {
          role: 'assistant',
          content: prepared.message,
          scope,
          targetId: getTargetId(),
          targetType: getTargetType(),
          applied: false,
        };
        setSession((prev) => addMessageToSession(prev, answerMessage));
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

        // Add assistant message to session
        const textSelectionMessage: Omit<ConversationMessage, 'id' | 'timestamp'> = {
          role: 'assistant',
          content: preparedSelection.response.summary,
          scope,
          targetId: getTargetId(),
          targetType: getTargetType(),
          applied: true,
        };
        setSession((prev) => addMessageToSession(prev, textSelectionMessage));

        setPrompt('');
        setMentionedAssets([]);
      } else if (request.scope === 'template' && 'response' in prepared && prepared.response.type === 'replace-template') {
        // 6a. Apply template replacement
        const mutation = prepared as PreparedAgentMutation & {
          response: { type: 'replace-template'; summary: string; explanation: string; mjml: string };
          normalizedMjml: string;
        };

        applyTemplateReplacement({
          editor,
          mutation,
          onUndoAvailable,
        });

        // Add assistant message to session
        const templateMessage: Omit<ConversationMessage, 'id' | 'timestamp'> = {
          role: 'assistant',
          content: mutation.response.summary,
          scope,
          targetId: 'entire-template',
          targetType: 'template',
          applied: true,
        };
        setSession((prev) => addMessageToSession(prev, templateMessage));

        setPrompt('');
        setMentionedAssets([]);
      } else {
        // 6b. Auto-apply validated component/section mutation
        const mutation = prepared as PreparedAgentMutation;
        const replacedComponent = applyAgentMutation({
          editor,
          request,
          mutation,
          onUndoAvailable,
        });

        if (replacedComponent) {
          setCurrentTarget(replacedComponent);
        }

        // Add assistant message to session
        const mutationMessage: Omit<ConversationMessage, 'id' | 'timestamp'> = {
          role: 'assistant',
          content: mutation.response.summary,
          scope,
          targetId: getTargetId(),
          targetType: getTargetType(),
          applied: true,
        };
        setSession((prev) => addMessageToSession(prev, mutationMessage));

        setPrompt('');
        setMentionedAssets([]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);

      // Add error message to session
      const errorMessage: Omit<ConversationMessage, 'id' | 'timestamp'> = {
        role: 'assistant',
        content: '',
        scope,
        targetId: getTargetId(),
        targetType: getTargetType(),
        error: errorMsg,
      };
      setSession((prev) => addMessageToSession(prev, errorMessage));

      setError(errorMsg);
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
            {scope}: {getTargetType()}
          </span>
        </div>
        <div style={styles.headerRight}>
          <button
            type="button"
            onClick={() => setShowAiSettings((value) => !value)}
            style={styles.settingsBtn}
            title="AI settings"
          >
            Settings
          </button>
          {session.recentMessages.length > 0 && (
            <button
              type="button"
              onClick={handleNewChat}
              style={styles.newChatBtn}
              title="Start new conversation"
            >
              New chat
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={styles.closeBtn}
            title="Close AI Assistant"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Target Info Bar */}
      <div style={styles.targetBar}>
        Target ID: <code style={styles.idCode}>{getTargetId()}</code>
        <span style={styles.modelBadge}>
          {aiSettings.model?.trim() || DEFAULT_GEMINI_MODEL}
        </span>
        {session.recentMessages.length > 0 && (
          <span style={styles.messageCount}>
            {session.recentMessages.length} message{session.recentMessages.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Conversation History */}
      {session.recentMessages.length > 0 && (
        <div style={styles.messagesContainer}>
          {session.recentMessages.map((msg) => (
            <div
              key={msg.id}
              style={msg.role === 'user' ? styles.userMessage : styles.assistantMessage}
            >
              <div style={styles.messageHeader}>
                <span style={styles.messageRole}>
                  {msg.role === 'user' ? 'You' : 'AI'}
                </span>
                {msg.targetType && (
                  <span style={styles.messageScopeBadge}>
                    {msg.scope}: {msg.targetType}
                  </span>
                )}
              </div>
              <div style={styles.messageContent}>
                {msg.error ? (
                  <span style={styles.messageError}>❌ {msg.error}</span>
                ) : (
                  msg.content
                )}
              </div>
              {msg.applied && (
                <span style={styles.appliedBadge}>✓ Applied</span>
              )}
            </div>
          ))}
        </div>
      )}

      {showAiSettings && (
        <div style={styles.settingsPanel}>
          <label style={styles.settingsField}>
            <span style={styles.settingsLabel}>Gemini API key</span>
            <input
              type="password"
              value={aiSettings.apiKey ?? ''}
              onChange={(event) =>
                setAiSettings((prev) => ({
                  ...prev,
                  apiKey: event.target.value,
                }))
              }
              placeholder="Paste your Gemini API key"
              autoComplete="off"
              style={styles.settingsInput}
            />
          </label>
          <label style={styles.settingsField}>
            <span style={styles.settingsLabel}>Model</span>
            <input
              type="text"
              value={aiSettings.model ?? DEFAULT_GEMINI_MODEL}
              onChange={(event) =>
                setAiSettings((prev) => ({
                  ...prev,
                  model: event.target.value,
                }))
              }
              placeholder={DEFAULT_GEMINI_MODEL}
              style={styles.settingsInput}
            />
          </label>
          <div style={styles.settingsHint}>
            Stored only in this browser. No AI key is read from .env.
          </div>
        </div>
      )}

      {/* Error Banner (only show for current/pending errors, history errors shown inline) */}
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
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          onChange={handleUploadAsset}
          style={styles.hiddenFileInput}
        />
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
            <button
              type="button"
              onClick={handleUploadAssetClick}
              disabled={isLoading || isUploadingAsset}
              style={{
                ...styles.uploadAssetBtn,
                opacity: isLoading || isUploadingAsset ? 0.6 : 1,
                cursor: isLoading || isUploadingAsset ? 'not-allowed' : 'pointer',
              }}
              title="Upload image and mention it in this AI request"
            >
              {isUploadingAsset ? 'Uploading…' : '+ Image'}
            </button>

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
              disabled={isLoading || !prompt.trim() || !aiSettings.apiKey?.trim()}
              style={{
                ...styles.sendBtn,
                opacity: isLoading || !prompt.trim() || !aiSettings.apiKey?.trim() ? 0.6 : 1,
                cursor: isLoading || !prompt.trim() || !aiSettings.apiKey?.trim() ? 'not-allowed' : 'pointer',
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
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  settingsBtn: {
    background: '#eef2ff',
    border: '1px solid #c7d2fe',
    color: '#4338ca',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '4px 10px',
    borderRadius: 4,
  },
  newChatBtn: {
    background: 'transparent',
    border: '1px solid #e5e7eb',
    color: '#6b7280',
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
    padding: '4px 10px',
    borderRadius: 4,
    transition: 'background-color 0.15s ease',
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
    display: 'flex',
    alignItems: 'center',
    gap: 8,
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
  modelBadge: {
    backgroundColor: '#ecfdf5',
    color: '#047857',
    padding: '1px 6px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 600,
  },
  messageCount: {
    marginLeft: 'auto',
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: 500,
  },
  settingsPanel: {
    padding: '12px 16px',
    backgroundColor: '#fbfdff',
    borderBottom: '1px solid #e5e7eb',
    display: 'grid',
    gridTemplateColumns: '1fr 180px',
    gap: 10,
  },
  settingsField: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  settingsLabel: {
    fontSize: 11,
    color: '#4b5563',
    fontWeight: 600,
  },
  settingsInput: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    padding: '8px 10px',
    fontSize: 12,
    outline: 'none',
  },
  settingsHint: {
    gridColumn: '1 / -1',
    fontSize: 11,
    color: '#6b7280',
  },
  messagesContainer: {
    maxHeight: 200,
    overflowY: 'auto',
    padding: '8px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    borderBottom: '1px solid #f3f4f6',
  },
  userMessage: {
    padding: '8px 10px',
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    fontSize: 12,
    borderLeft: '3px solid #6366f1',
  },
  assistantMessage: {
    padding: '8px 10px',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    fontSize: 12,
    borderLeft: '3px solid #10b981',
  },
  messageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  messageRole: {
    fontSize: 11,
    fontWeight: 600,
    color: '#374151',
  },
  messageScopeBadge: {
    fontSize: 9,
    fontWeight: 500,
    backgroundColor: '#e5e7eb',
    color: '#6b7280',
    padding: '1px 5px',
    borderRadius: 8,
  },
  messageContent: {
    lineHeight: 1.4,
    color: '#1f2937',
    wordBreak: 'break-word',
  },
  messageError: {
    color: '#dc2626',
    fontSize: 11,
  },
  appliedBadge: {
    display: 'inline-block',
    marginTop: 4,
    fontSize: 10,
    fontWeight: 500,
    color: '#059669',
    backgroundColor: '#d1fae5',
    padding: '1px 6px',
    borderRadius: 8,
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
  hiddenFileInput: {
    display: 'none',
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
  uploadAssetBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    color: '#374151',
    padding: '7px 12px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
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
