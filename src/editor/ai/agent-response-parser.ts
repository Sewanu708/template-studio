import type { AgentResponse } from './agent-types';

/**
 * Strips optional markdown code fence around JSON.
 */
function unwrapCodeFences(raw: string): string {
  const trimmed = raw.trim();
  const fenceRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/i;
  const match = trimmed.match(fenceRegex);
  return match ? match[1].trim() : trimmed;
}

/**
 * Parses raw model output into a strictly typed AgentResponse.
 * Throws clear errors if the response is not valid JSON or doesn't match the schema.
 */
export function parseAgentResponse(raw: string): AgentResponse {
  if (!raw || !raw.trim()) {
    throw new Error('AI response is empty.');
  }

  const unwrapped = unwrapCodeFences(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(unwrapped);
  } catch (err) {
    throw new Error(
      `AI returned invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('AI response must be a JSON object.');
  }

  const candidate = parsed as Record<string, unknown>;

  if (typeof candidate.type !== 'string') {
    throw new Error('AI response missing required "type" field.');
  }

  if (candidate.type === 'answer') {
    if (typeof candidate.summary !== 'string') {
      throw new Error('AI answer response missing "summary" field.');
    }
    if (typeof candidate.message !== 'string') {
      throw new Error('AI answer response missing "message" field.');
    }
    return {
      type: 'answer',
      summary: candidate.summary,
      message: candidate.message,
    };
  }

  if (
    candidate.type === 'replace-component' ||
    candidate.type === 'replace-section'
  ) {
    if (typeof candidate.targetId !== 'string' || !candidate.targetId.trim()) {
      throw new Error(`AI ${candidate.type} response missing valid "targetId".`);
    }
    if (typeof candidate.summary !== 'string') {
      throw new Error(`AI ${candidate.type} response missing "summary".`);
    }
    if (typeof candidate.explanation !== 'string') {
      throw new Error(`AI ${candidate.type} response missing "explanation".`);
    }
    if (typeof candidate.mjml !== 'string' || !candidate.mjml.trim()) {
      throw new Error(
        `AI ${candidate.type} response missing non-empty "mjml" snippet.`,
      );
    }

    return {
      type: candidate.type,
      targetId: candidate.targetId,
      summary: candidate.summary,
      explanation: candidate.explanation,
      mjml: candidate.mjml.trim(),
    };
  }

  if (candidate.type === 'replace-text-selection') {
    if (typeof candidate.targetId !== 'string' || !candidate.targetId.trim()) {
      throw new Error('AI replace-text-selection response missing valid "targetId".');
    }
    if (typeof candidate.summary !== 'string') {
      throw new Error('AI replace-text-selection response missing "summary".');
    }
    if (typeof candidate.replacementHtml !== 'string' || !candidate.replacementHtml.trim()) {
      throw new Error('AI replace-text-selection response missing non-empty "replacementHtml".');
    }

    return {
      type: 'replace-text-selection',
      targetId: candidate.targetId,
      summary: candidate.summary,
      explanation: typeof candidate.explanation === 'string' ? candidate.explanation : undefined,
      replacementHtml: candidate.replacementHtml.trim(),
    };
  }

  throw new Error(
    `Unsupported AI response type: "${String(candidate.type)}". Expected "replace-component", "replace-section", "replace-text-selection", or "answer".`,
  );
}
