import type { AgentSession, ConversationMessage } from './agent-types';

const STORAGE_KEY = 'builder-ai-session';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const MAX_RECENT_MESSAGES = 10;


export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createSession(): AgentSession {
  const now = Date.now();
  return {
    id: generateSessionId(),
    compactedSummary: null,
    recentMessages: [],
    createdAt: now,
    lastActivityAt: now,
  };
}

export function loadSession(): AgentSession | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const session = JSON.parse(stored) as AgentSession;

    // Check if session has expired
    if (Date.now() - session.lastActivityAt > SESSION_TIMEOUT_MS) {
      clearSession();
      return null;
    }

    return session;
  } catch {
    // Corrupted data or localStorage unavailable
    return null;
  }
}

export function saveSession(session: AgentSession): void {
  try {
    const updated: AgentSession = {
      ...session,
      lastActivityAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage might be full or disabled — fail silently
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

export function addMessageToSession(
  session: AgentSession,
  message: Omit<ConversationMessage, 'id' | 'timestamp'>,
): AgentSession {
  const newMessage: ConversationMessage = {
    ...message,
    id: generateMessageId(),
    timestamp: Date.now(),
  };

  // Cap messages after append to maintain bounded window
  const updatedMessages = [...session.recentMessages, newMessage].slice(
    -MAX_RECENT_MESSAGES,
  );

  return {
    ...session,
    recentMessages: updatedMessages,
    lastActivityAt: Date.now(),
  };
}

/**
 * Extracts session context to include in an AgentRequest.
 * Returns the compacted summary (if any) and recent messages.
 */
export function getSessionForRequest(session: AgentSession): {
  sessionContext: string | undefined;
  conversationHistory: ConversationMessage[];
} {
  return {
    sessionContext: session.compactedSummary ?? undefined,
    conversationHistory: session.recentMessages,
  };
}

// -----------------------------------------------------------------------------
// Session initialization helper
// -----------------------------------------------------------------------------

/**
 * Loads existing session or creates a new one.
 * Useful for component initialization.
 */
export function getOrCreateSession(): AgentSession {
  return loadSession() ?? createSession();
}
