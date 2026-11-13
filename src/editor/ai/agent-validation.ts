import type { Editor } from 'grapesjs';
import type {
  AgentRequest,
  AgentScope,
  PreparedAgentMutation,
} from './agent-types';
import { parseAgentResponse } from './agent-response-parser';
import { validateAgentScope } from './agent-scope';
import { validateBuilderStructure } from './agent-structure';
import { normalizeAgentMjml } from './agent-normalize';
import { sanitizeInlineHtml } from './text-selection-context';
import { validateNoHiddenTemplateStyling } from './agent-hidden-style-validation';

/**
 * Wraps candidate MJML snippet in root document tags so it can be compiled by the MJML engine.
 */
export function wrapCandidateForCompile(
  mjml: string,
  scope: AgentScope,
): string {
  if (scope === 'template') {
    // Template scope already has full <mjml> document
    return mjml;
  }
  if (scope === 'component') {
    return `<mjml><mj-body><mj-section><mj-column>${mjml}</mj-column></mj-section></mj-body></mjml>`;
  }
  // section scope
  return `<mjml><mj-body>${mjml}</mj-body></mjml>`;
}

/**
 * Compiles wrapped candidate MJML through the editor's MJML compiler command
 * to verify it compiles into valid HTML before applying.
 */
export function compileCandidateMjml(
  candidateMjml: string,
  scope: AgentScope,
  editor?: Editor,
): void {
  const wrapped = wrapCandidateForCompile(candidateMjml, scope);

  if (editor) {
    try {
      const result = editor.runCommand('mjml-code-to-html', {
        mjml: wrapped,
      }) as
        | {
            html?: string;
            errors?: Array<{ message?: string; formattedMessage?: string }>;
          }
        | undefined;

      if (!result || typeof result.html !== 'string' || !result.html.trim()) {
        throw new Error('The MJML compiler produced empty HTML output.');
      }

      if (Array.isArray(result.errors) && result.errors.length > 0) {
        const messages = result.errors
          .map((error) => error.formattedMessage || error.message)
          .filter(Boolean)
          .join('\n');

        throw new Error(
          messages || `The MJML compiler reported ${result.errors.length} error(s).`,
        );
      }
    } catch (err) {
      throw new Error(
        `Failed to compile AI generated MJML: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

/**
 * Orchestrates the full validation and preparation pipeline for an AI response:
 * 1. Parse JSON & check schema
 * 2. Scope validation (component vs section)
 * 3. Safe normalization & repair
 * 4. Structure & security validation
 * 5. Candidate compile test
 */
export function validateAndPrepareAgentResponse(params: {
  raw: string;
  request: AgentRequest;
  editor?: Editor;
}):
  | PreparedAgentMutation
  | { type: 'answer'; message: string; summary: string } {
  const { raw, request, editor } = params;

  // 1. Strict parse
  const response = parseAgentResponse(raw);
  if (response.type === 'answer') {
    return response;
  }

  // 2. Scope validation
  validateAgentScope(response, request);

  if (request.scope === 'text-selection') {
    if (response.type !== 'replace-text-selection') {
      throw new Error(
        `Text-selection requests must return replace-text-selection, received ${response.type}.`,
      );
    }

    const sanitizedHtml = sanitizeInlineHtml(response.replacementHtml);
    if (!sanitizedHtml) {
      throw new Error('Text-selection response sanitize step produced empty output.');
    }

    const candidate = `<mj-text>${sanitizedHtml}</mj-text>`;
    validateBuilderStructure(candidate, 'component');
    compileCandidateMjml(candidate, 'component', editor);

    return {
      response,
      normalizedHtml: sanitizedHtml,
    };
  }

  if (response.type === 'replace-text-selection') {
    throw new Error(
      'Text-selection responses are not allowed in non-text-selection AI requests.',
    );
  }

  // Template scope
  if (request.scope === 'template' && response.type === 'replace-template') {
    const normalizedMjml = normalizeAgentMjml(response.mjml, 'template');
    validateNoHiddenTemplateStyling(normalizedMjml, 'template');
    validateBuilderStructure(normalizedMjml, 'template');
    compileCandidateMjml(normalizedMjml, 'template', editor);

    return {
      response,
      normalizedMjml,
    };
  }

  // 3. Normalization (safe defaults + wrapper repair)
  const normalizedMjml = normalizeAgentMjml(response.mjml, request.scope);

  // 4. Hidden-style validation (before structure check)
  validateNoHiddenTemplateStyling(normalizedMjml, request.scope);

  // 5. Structure validation
  validateBuilderStructure(normalizedMjml, request.scope);

  // 6. Compile validation
  compileCandidateMjml(normalizedMjml, request.scope, editor);

  return {
    response,
    normalizedMjml,
  };
}
