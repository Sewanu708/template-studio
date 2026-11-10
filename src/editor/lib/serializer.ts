import type { Editor } from 'grapesjs';

/**
 * GrapesJS MJML owns serialization and compilation. Using its commands keeps
 * custom components, raw content, escaping, and plugin updates in one path.
 */

export interface MjmlCompileError {
  line?: number;
  message?: string;
  tagName?: string;
  formattedMessage?: string;
}

export interface MjmlCompileResult {
  html: string;
  errors?: MjmlCompileError[];
}

export function getMjml(editor: Editor): string {
  const result: unknown = editor.runCommand('mjml-code');
  return typeof result === 'string' ? result : editor.getHtml().trim();
}

export function getCompiledHtml(editor: Editor): MjmlCompileResult {
  const result: unknown = editor.runCommand('mjml-code-to-html');

  if (!result || typeof result !== 'object' || typeof (result as MjmlCompileResult).html !== 'string') {
    throw new Error('The MJML compiler did not return HTML.');
  }

  return result as MjmlCompileResult;
}

export function getProjectJson(editor: Editor): object {
  return editor.getProjectData();
}

export function loadProjectJson(editor: Editor, data: object): void {
  editor.loadProjectData(data);
}
