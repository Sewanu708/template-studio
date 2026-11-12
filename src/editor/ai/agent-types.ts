export type AgentScope = 'component' | 'section' | 'text-selection';

export type AgentTextSelectionResponse = Extract<
  AgentResponse,
  { type: 'replace-text-selection' }
>;

export interface MentionedAsset {
  id: string;
  name: string;
  url: string;
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

export interface AgentRequest {
  scope: AgentScope;
  prompt: string;
  fullMjml: string;
  target: AgentTargetContext;
  textSelection?: AgentTextSelectionContext | null;
  mentionedAssets: MentionedAsset[];
}

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
      type: 'answer';
      summary: string;
      message: string;
    };

export interface PreparedAgentMutation {
  response: Exclude<AgentResponse, { type: 'answer' }>;
  normalizedMjml?: string;
  normalizedHtml?: string;
}

export interface AgentValidationError {
  code: string;
  message: string;
}
