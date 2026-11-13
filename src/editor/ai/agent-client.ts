import type { AgentRequest, ConversationMessage } from './agent-types';
import { EMAIL_AGENT_SYSTEM_PROMPT } from './system-prompt';
import { formatCanvasSummaryForPrompt } from './canvas-summary';
import { inferImageMimeType } from './image-mentions';

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
  error?: {
    message?: string;
  };
}

export const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';

const DEFAULT_AI_TIMEOUT_MS = 90_000;

export interface AgentClientConfig {
  apiKey: string;
  model?: string;
  timeoutMs?: number;
}

type GeminiPart =
  | { text: string }
  | { fileData: { mimeType: string; fileUri: string } };

type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] };

const GEMINI_VISION_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function getVisionAssetParts(request: AgentRequest): GeminiPart[] {
  return request.mentionedAssets
    .slice(0, 10)
    .map((asset): GeminiPart | null => {
      const fileUri = asset.url.trim();
      const mimeType = (
        asset.mimeType
        || inferImageMimeType(asset.url)
        || inferImageMimeType(asset.name)
        || ''
      ).trim();

      if (!fileUri || !mimeType || !GEMINI_VISION_MIME_TYPES.has(mimeType)) {
        return null;
      }

      return {
        fileData: {
          mimeType,
          fileUri,
        },
      };
    })
    .filter((part): part is GeminiPart => Boolean(part));
}

function formatTimeout(ms: number): string {
  const seconds = Math.round(ms / 1000);
  return `${seconds}s`;
}

function isRequestTimeoutError(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith('AI request timed out');
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs = DEFAULT_AI_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  let didTimeout = false;

  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);

  const parentSignal = init.signal;
  const abortFromParent = () => {
    controller.abort();
  };

  if (parentSignal?.aborted) {
    abortFromParent();
  } else {
    parentSignal?.addEventListener('abort', abortFromParent, { once: true });
  }

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (err) {
    if (didTimeout) {
      throw new Error(`AI request timed out after ${formatTimeout(timeoutMs)}.`);
    }

    throw err;
  } finally {
    clearTimeout(timeoutId);
    parentSignal?.removeEventListener('abort', abortFromParent);
  }
}

/**
 * Format a history message for the Gemini conversation.
 * For assistant messages, we include only the summary to avoid huge JSON payloads.
 */
function formatHistoryMessage(msg: ConversationMessage): string {
  if (msg.role === 'assistant') {
    // Don't send full MJML back to the model; use summary only
    if (msg.error) {
      return `[Error: ${msg.error}]`;
    }
    return msg.content || '[Applied changes]';
  }
  return msg.content;
}

/**
 * Builds the final user prompt for the current request.
 * Includes canvas summary when available.
 */
function buildCurrentRequestPrompt(request: AgentRequest): string {
  const parts: string[] = [];

  parts.push('=== Current Request ===');
  parts.push(`Scope: ${request.scope}`);

  // Add canvas summary for context
  if (request.canvasSummary) {
    parts.push('');
    parts.push('Current canvas state:');
    parts.push(formatCanvasSummaryForPrompt(request.canvasSummary));
  }

  parts.push('');
  parts.push('Request details:');

  // Create a sanitized request object without conversation history and canvas summary
  // (to avoid duplication since those are sent separately)
  const { conversationHistory, sessionContext, canvasSummary, ...coreRequest } = request;
  parts.push(JSON.stringify(coreRequest, null, 2));

  if (request.mentionedAssets.length > 0) {
    parts.push('');
    parts.push(
      'Attached image note: supported mentioned images are included as visual parts in this same message. Inspect them directly for palette, brightness, mood, subject, and contrast before editing.',
    );
  }

  parts.push('');
  parts.push('Return only the strict JSON object described in the system instruction.');

  return parts.join('\n');
}

/**
 * Builds the Gemini contents array with conversation history.
 */
function buildGeminiContents(request: AgentRequest): GeminiContent[] {
  const contents: GeminiContent[] = [];

  // Add compacted session context as initial context if present
  if (request.sessionContext) {
    contents.push({
      role: 'user',
      parts: [{ text: `[Previous conversation summary]: ${request.sessionContext}` }],
    });
    // Add synthetic acknowledgment so model knows context was received
    contents.push({
      role: 'model',
      parts: [{ text: 'Understood. I have the previous conversation context.' }],
    });
  }

  // Add recent conversation history
  if (request.conversationHistory && request.conversationHistory.length > 0) {
    for (const msg of request.conversationHistory) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: formatHistoryMessage(msg) }],
      });
    }
  }

  // Add current request as final user message
  contents.push({
    role: 'user',
    parts: [
      { text: buildCurrentRequestPrompt(request) },
      ...getVisionAssetParts(request),
    ],
  });

  return contents;
}

async function callGeminiDirect(
  request: AgentRequest,
  options: { signal?: AbortSignal; config: AgentClientConfig },
): Promise<string> {
  const apiKey = options.config.apiKey.trim();
  const model = options.config.model?.trim() || DEFAULT_GEMINI_MODEL;
  const timeoutMs = options.config.timeoutMs ?? DEFAULT_AI_TIMEOUT_MS;

  if (!apiKey) {
    throw new Error(
      'Gemini API key is required. Enter your key in AI settings before generating.',
    );
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  let response: Response;

  try {
    response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: EMAIL_AGENT_SYSTEM_PROMPT }],
        },
        contents: buildGeminiContents(request),
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
      signal: options?.signal,
    }, timeoutMs);
  } catch (err) {
    if (isRequestTimeoutError(err)) {
      throw err;
    }

    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('AI request was cancelled.');
    }
    throw new Error(
      `Could not reach Gemini. Check your network and Gemini API access for "${model}".`,
    );
  }

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      text.trim() || `Gemini request failed with status ${response.status}.`,
    );
  }

  let payload: GeminiGenerateContentResponse;
  try {
    payload = JSON.parse(text) as GeminiGenerateContentResponse;
  } catch {
    throw new Error('Gemini returned a non-JSON API response.');
  }

  if (payload.error?.message) {
    throw new Error(payload.error.message);
  }

  if (payload.promptFeedback?.blockReason) {
    throw new Error(
      `Gemini blocked the request: ${payload.promptFeedback.blockReason}.`,
    );
  }

  const candidate = payload.candidates?.[0];
  const rawOutput = candidate?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('')
    .trim();

  if (!rawOutput) {
    throw new Error(
      candidate?.finishReason
        ? `Gemini returned no text. Finish reason: ${candidate.finishReason}.`
        : 'Gemini returned an empty response.',
    );
  }

  return rawOutput;
}

/**
 * Sends an AgentRequest directly to Gemini.
 * Returns raw response text — parsing happens in agent-response-parser.ts.
 */
export async function callEmailAgent(
  request: AgentRequest,
  options: { signal?: AbortSignal; config: AgentClientConfig },
): Promise<string> {
  return callGeminiDirect(request, options);
}
