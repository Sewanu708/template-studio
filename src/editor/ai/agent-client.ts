import type { AgentRequest } from './agent-types';
import { EMAIL_AGENT_SYSTEM_PROMPT } from './system-prompt';

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

function getBrowserEnv(name: keyof ImportMetaEnv): string {
  return String(import.meta.env?.[name] ?? '').trim();
}

function getGeminiModel(): string {
  return getBrowserEnv('VITE_GEMINI_MODEL') || 'gemini-2.5-flash';
}

function buildGeminiPrompt(request: AgentRequest): string {
  return [
    'Edit the email using this exact request context.',
    'Return only the strict JSON object described in the system instruction.',
    '',
    JSON.stringify(request, null, 2),
  ].join('\n');
}

async function callGeminiDirect(
  request: AgentRequest,
  options?: { signal?: AbortSignal },
): Promise<string> {
  const apiKey = getBrowserEnv('VITE_GEMINI_API_KEY');
  const model = getGeminiModel();

  if (!apiKey) {
    throw new Error(
      'Gemini API key is not configured. Set VITE_GEMINI_API_KEY in your .env file.',
    );
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: EMAIL_AGENT_SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: buildGeminiPrompt(request) }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
      signal: options?.signal,
    });
  } catch (err) {
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

async function callConfiguredEndpoint(
  endpoint: string,
  request: AgentRequest,
  options?: { signal?: AbortSignal },
): Promise<string> {
  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: options?.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('AI request was cancelled.');
    }
    throw new Error(
      `Could not reach the AI endpoint. Is the server running at ${endpoint}?`,
    );
  }

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      text.trim() || `AI request failed with status ${response.status}.`,
    );
  }

  if (!text.trim()) {
    throw new Error('AI returned an empty response.');
  }

  return text;
}

/**
 * Sends an AgentRequest to Gemini directly, or to a configured AI endpoint.
 * Returns raw response text — parsing happens in agent-response-parser.ts.
 */
export async function callEmailAgent(
  request: AgentRequest,
  options?: { signal?: AbortSignal },
): Promise<string> {
  const geminiApiKey = getBrowserEnv('VITE_GEMINI_API_KEY');
  if (geminiApiKey) {
    return callGeminiDirect(request, options);
  }

  const endpoint = getBrowserEnv('VITE_EMAIL_AGENT_ENDPOINT');
  if (!endpoint) {
    throw new Error(
      'AI is not configured. Set VITE_GEMINI_API_KEY for direct Gemini calls, or VITE_EMAIL_AGENT_ENDPOINT for a proxy endpoint.',
    );
  }

  return callConfiguredEndpoint(endpoint, request, options);
}
