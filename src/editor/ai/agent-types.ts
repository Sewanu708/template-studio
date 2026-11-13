
export type AgentScope = 'component' | 'section' | 'text-selection' | 'template';

export interface MentionedAsset {
  id: string;
  name: string;
  url: string;
  mimeType?: string;
}

export interface AgentTargetContext {
  id: string;
  type: string;
  mjml: string;
  parentType?: string;
}

export interface AgentTextSelectionContext {
  targetId: string;
  targetType: 'mj-text' | 'mj-button';
  fullComponentMjml: string;
  fullComponentHtml: string;
  selectedText: string;
  selectedHtml: string;
  beforeText: string;
  afterText: string;
  selectionPath?: string;
}

// -----------------------------------------------------------------------------
// Canvas summary
// -----------------------------------------------------------------------------

export interface CanvasSummary {
  sectionCount: number;
  sections: Array<{
    index: number;
    columnCount: number;
    componentTypes: string[];
  }>;
  primaryColors: string[];
  fonts: string[];
}

// -----------------------------------------------------------------------------
// Conversation / Session
// -----------------------------------------------------------------------------

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  scope: AgentScope;
  targetId?: string;
  targetType?: string;
  applied?: boolean;
  error?: string;
}

export interface AgentSession {
  id: string;
  compactedSummary: string | null;
  recentMessages: ConversationMessage[];
  createdAt: number;
  lastActivityAt: number;
}

// -----------------------------------------------------------------------------
// Request
// -----------------------------------------------------------------------------

export interface AgentRequest {
  scope: AgentScope;
  prompt: string;
  fullMjml: string;
  /** Optional for template scope; required for component/section/text-selection. */
  target?: AgentTargetContext;
  textSelection?: AgentTextSelectionContext | null;
  mentionedAssets: MentionedAsset[];
  /** Structural overview of the canvas. */
  canvasSummary?: CanvasSummary;
  /** Compacted summary from earlier conversation turns. */
  sessionContext?: string;
  /** Recent conversation messages (bounded window). */
  conversationHistory?: ConversationMessage[];
}

// -----------------------------------------------------------------------------
// Response
// -----------------------------------------------------------------------------

export type AgentResponse =
  | {
      type: 'replace-component';
      targetId: string;
      summary: string;
      explanation: string;
      mjml: string;
    }
  | {
      type: 'replace-section';
      targetId: string;
      summary: string;
      explanation: string;
      mjml: string;
    }
  | {
      type: 'replace-text-selection';
      targetId: string;
      summary: string;
      explanation?: string;
      replacementHtml: string;
    }
  | {
      type: 'replace-template';
      summary: string;
      explanation: string;
      mjml: string;
    }
  | {
      type: 'answer';
      summary: string;
      message: string;
    };

// -----------------------------------------------------------------------------
// Convenience type aliases
// -----------------------------------------------------------------------------

export type AgentTextSelectionResponse = Extract<
  AgentResponse,
  { type: 'replace-text-selection' }
>;

export type AgentTemplateResponse = Extract<
  AgentResponse,
  { type: 'replace-template' }
>;

// -----------------------------------------------------------------------------
// Prepared mutation
// -----------------------------------------------------------------------------

export interface PreparedAgentMutation {
  response: Exclude<AgentResponse, { type: 'answer' }>;
  normalizedMjml?: string;
  normalizedHtml?: string;
}

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------

export interface AgentValidationError {
  code: string;
  message: string;
}
