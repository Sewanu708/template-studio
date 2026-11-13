import type { AgentRequest } from './agent-types';
import type { AgentRepairableValidationError } from './agent-hidden-style-validation';

/**
 * Builds the repair instruction to prepend to the repair request prompt.
 */
function buildRepairInstruction(
  validationError: AgentRepairableValidationError,
): string {
  const reasonsList = validationError.repairReasons
    .map((reason) => `- ${reason}`)
    .join('\n');

  return `Your previous response cannot be applied to the visual email builder because it used hidden or unsupported styling:

${reasonsList}

Rewrite the same response using only explicit MJML attributes directly on body components.

Rules:
- Keep <mj-head></mj-head> empty.
- Do not use mj-attributes, mj-all, mj-class, mj-style, mj-html-attributes, css-class, custom CSS, raw HTML, gradients, box-shadow, transform, hover states, or media queries.
- Put all visible styles directly on editable MJML body components.
- For <mj-button>, use inner-padding="top right bottom left". Do not use inner-padding-top, inner-padding-right, inner-padding-bottom, or inner-padding-left.
- Preserve the user's original request, layout, copy, images, colors as closely as possible, and overall design intent.
- Return strict JSON only using the same response schema as before.
- If the original response type was replace-template, return replace-template.
- If the original response type was replace-section, return replace-section.
- If the original response type was replace-component, return replace-component.`;
}

/**
 * Builds a repair request that asks the model to rewrite its invalid response.
 *
 * The repair request:
 * - Keeps the same scope and context as the original request
 * - Replaces the prompt with a repair instruction
 * - Includes the invalid raw response for reference
 * - Includes the exact validation reasons
 */
export function buildRepairAgentRequest(params: {
  originalRequest: AgentRequest;
  invalidResponse: string;
  validationError: AgentRepairableValidationError;
}): AgentRequest {
  const { originalRequest, invalidResponse, validationError } = params;

  const repairInstruction = buildRepairInstruction(validationError);

  // Build a repair prompt that includes:
  // 1. The original user prompt (for context)
  // 2. The invalid response (so the model knows what to fix)
  // 3. The repair instruction with validation reasons
  const repairPrompt = `ORIGINAL USER REQUEST:
${originalRequest.prompt}

YOUR PREVIOUS (INVALID) RESPONSE:
${invalidResponse}

REPAIR INSTRUCTION:
${repairInstruction}`;

  return {
    ...originalRequest,
    prompt: repairPrompt,
    // Keep the same conversation history but don't add the invalid response to it
    // The repair prompt already contains the invalid response for reference
  };
}
