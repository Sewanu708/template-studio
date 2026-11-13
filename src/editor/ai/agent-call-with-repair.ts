import type { Editor } from 'grapesjs';
import type { AgentRequest, PreparedAgentMutation } from './agent-types';
import { callEmailAgent, type AgentClientConfig } from './agent-client';
import { validateAndPrepareAgentResponse } from './agent-validation';
import {
  isRepairableAgentError,
  REPAIR_FAILURE_USER_MESSAGE,
} from './agent-hidden-style-validation';
import { buildRepairAgentRequest } from './agent-repair-request';

/**
 * Result of a successful AI call with optional repair.
 */
export type AgentCallResult =
  | PreparedAgentMutation
  | { type: 'answer'; message: string; summary: string };

/**
 * Options for the agent call with repair.
 */
export interface AgentCallWithRepairOptions {
  request: AgentRequest;
  editor?: Editor;
  signal?: AbortSignal;
  aiConfig: AgentClientConfig;
  /** Optional callback for logging/debugging repair attempts. */
  onRepairAttempt?: (info: {
    reasons: string[];
    invalidResponse: string;
  }) => void;
}

/**
 * Calls the AI agent and automatically retries once if the response contains
 * hidden/uneditable styling that fails validation.
 *
 * Flow:
 * 1. Call AI
 * 2. Validate & prepare response
 * 3. If valid, return prepared response
 * 4. If AgentRepairableValidationError, build repair request and retry once
 * 5. Validate & prepare repaired response
 * 6. Return repaired response if valid
 * 7. If repaired response also fails, throw user-friendly error
 *
 * This helper keeps the retry logic isolated from the UI layer.
 */
export async function callAndPrepareAgentResponseWithRepair(
  options: AgentCallWithRepairOptions,
): Promise<AgentCallResult> {
  const { request, editor, signal, aiConfig, onRepairAttempt } = options;

  // First attempt
  const rawResponse = await callEmailAgent(request, {
    signal,
    config: aiConfig,
  });

  try {
    return validateAndPrepareAgentResponse({
      raw: rawResponse,
      request,
      editor,
    });
  } catch (err) {
    // If not a repairable error, re-throw immediately
    if (!isRepairableAgentError(err)) {
      throw err;
    }

    // Check if aborted before attempting repair
    if (signal?.aborted) {
      throw new Error('AI request was cancelled.');
    }

    // Log repair attempt if callback provided
    onRepairAttempt?.({
      reasons: err.repairReasons,
      invalidResponse: rawResponse,
    });

    // Build repair request
    const repairRequest = buildRepairAgentRequest({
      originalRequest: request,
      invalidResponse: rawResponse,
      validationError: err,
    });

    // Retry once with repair request
    const repairedRaw = await callEmailAgent(repairRequest, {
      signal,
      config: aiConfig,
    });

    try {
      return validateAndPrepareAgentResponse({
        raw: repairedRaw,
        request, // Use original request for validation context
        editor,
      });
    } catch (repairErr) {
      // If the repaired response still fails for the same hidden-styling class,
      // show the friendly product message. If it fails for a different concrete
      // reason (eg. illegal MJML attribute), preserve that reason so we can
      // fix prompts/normalizers instead of masking it.
      if (isRepairableAgentError(repairErr)) {
        console.error(
          '[ai] Repair attempt also failed with hidden styling:',
          repairErr.repairReasons,
        );

        throw new Error(REPAIR_FAILURE_USER_MESSAGE);
      } else {
        console.error('[ai] Repair attempt failed:', repairErr);
      }

      throw repairErr;
    }
  }
}
