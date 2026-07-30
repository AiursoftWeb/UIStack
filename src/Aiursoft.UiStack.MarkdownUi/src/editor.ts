import { attachImageUpload, type ImageUploadController, type ImageUploadOptions } from "./image-upload";
import { renderMarkdown, type MarkdownOptions } from "./markdown";
import { enhanceMarkdown, type ReaderDependencies } from "./reader";

export type MarkdownViewMode = "editor" | "split" | "preview";

export interface MonacoPosition {
  lineNumber: number;
  column: number;
}

export interface MonacoSelection {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface MonacoModel {
  getLineContent(lineNumber: number): string;
  getLineCount(): number;
  getValueInRange(selection: MonacoSelection): string;
}

export interface MonacoKeyboardEvent {
  keyCode: number;
  preventDefault(): void;
  stopPropagation?(): void;
}

export interface MonacoDisposable {
  dispose(): void;
}

export interface MonacoEditorInstance {
  getValue(): string;
  setValue(value: string): void;
  getPosition(): MonacoPosition | null;
  getSelection(): MonacoSelection | null;
  getModel(): MonacoModel | null;
  getDomNode(): HTMLElement | null;
  executeEdits(source: string, edits: Array<{
    range: MonacoSelection;
    text: string;
    forceMoveMarkers?: boolean;
  }>): void;
  onDidChangeModelContent(callback: () => void): MonacoDisposable;
  onKeyDown?(callback: (event: MonacoKeyboardEvent) => void): MonacoDisposable;
  addCommand?(keybinding: number, callback: () => void): string | null;
  focus(): void;
  layout(): void;
  dispose(): void;
}

export interface MonacoApi {
  editor: {
    create(container: HTMLElement, options: Record<string, unknown>): MonacoEditorInstance;
  };
  KeyMod?: {
    CtrlCmd: number;
  };
  KeyCode?: {
    Enter: number;
    KeyB: number;
    KeyI: number;
    KeyK: number;
    KeyL: number;
    KeyS: number;
    Digit1: number;
    Digit2: number;
    Digit3: number;
    Digit4: number;
    Digit5: number;
    Digit6: number;
  };
}

export interface MarkdownViewModeControl {
  element: HTMLElement;
  mode: MarkdownViewMode;
}

export interface CreateMarkdownEditorOptions extends ReaderDependencies {
  editorContainer: HTMLElement;
  textarea: HTMLTextAreaElement;
  previewContainer: HTMLElement;
  monaco?: MonacoApi;
  loadMonaco?: () => Promise<MonacoApi>;
  editorOptions?: Record<string, unknown>;
  theme?: string;
  debounceMs?: number;
  markdownOptions?: MarkdownOptions;
  uploadUrl?: string;
  imageUploadOptions?: Omit<ImageUploadOptions, "editor" | "uploadUrl">;
  form?: HTMLFormElement;
  editorPane?: HTMLElement;
  previewPane?: HTMLElement;
  initialViewMode?: MarkdownViewMode;
  viewModeStorageKey?: string;
  viewModeControls?: Iterable<MarkdownViewModeControl>;
  mermaidTheme?: string;
  onSave?: (markdown: string) => void | Promise<void>;
  onChange?: (markdown: string) => void;
  onPreviewRendered?: (markdown: string) => void;
  onInitializationError?: (error: unknown) => void;
  onPreviewError?: (error: unknown) => void;
  /** @deprecated Use onInitializationError and onPreviewError instead. */
  onError?: (error: unknown) => void;
}

export interface MarkdownEditorController {
  readonly editor: MonacoEditorInstance | null;
  readonly isFallback: boolean;
  getValue(): string;
  syncTextarea(): void;
  setValue(markdown: string): void;
  focus(): void;
  getViewMode(): MarkdownViewMode;
  setViewMode(mode: MarkdownViewMode): Promise<void>;
  refreshPreview(): Promise<void>;
  dispose(): void;
}

export interface MonacoAmdLoader {
  (
    dependencies: string[],
    onLoad: () => void,
    onError?: (error: unknown) => void
  ): void;
}

export function loadMonacoFromAmd(
  amdRequire: MonacoAmdLoader | undefined = (globalThis as typeof globalThis & {
    require?: MonacoAmdLoader;
  }).require
): Promise<MonacoApi> {
  return new Promise((resolve, reject) => {
    if (typeof amdRequire !== "function") {
      reject(new Error("Monaco AMD loader is unavailable."));
      return;
    }
    amdRequire(
      ["vs/editor/editor.main"],
      () => {
        const monaco = (globalThis as typeof globalThis & { monaco?: MonacoApi }).monaco;
        if (monaco) resolve(monaco);
        else reject(new Error("Monaco AMD module loaded without exposing window.monaco."));
      },
      reject
    );
  });
}

const modes: MarkdownViewMode[] = ["editor", "split", "preview"];

function isViewMode(value: string | null): value is MarkdownViewMode {
  return value !== null && modes.includes(value as MarkdownViewMode);
}

function selectionAt(position: MonacoPosition): MonacoSelection {
  return {
    startLineNumber: position.lineNumber,
    startColumn: position.column,
    endLineNumber: position.lineNumber,
    endColumn: position.column
  };
}

function registerShortcuts(
  editor: MonacoEditorInstance,
  monaco: MonacoApi,
  onSave?: (markdown: string) => void | Promise<void>
): MonacoDisposable[] {
  const disposables: MonacoDisposable[] = [];
  const keyMod = monaco.KeyMod?.CtrlCmd;
  const keyCode = monaco.KeyCode;
  if (!keyMod || !keyCode || !editor.addCommand) return disposables;
  const addCommand = editor.addCommand.bind(editor);

  const wrapSelection = (opening: string, closing: string): void => {
    const selection = editor.getSelection();
    const model = editor.getModel();
    if (!selection || !model) return;
    const selected = model.getValueInRange(selection);
    editor.executeEdits("markdown-shortcut", [{
      range: selection,
      text: `${opening}${selected}${closing}`,
      forceMoveMarkers: true
    }]);
  };

  addCommand(keyMod | keyCode.KeyB, () => wrapSelection("**", "**"));
  addCommand(keyMod | keyCode.KeyI, () => wrapSelection("*", "*"));
  addCommand(keyMod | keyCode.KeyK, () => {
    const selection = editor.getSelection();
    const block = selection && selection.startLineNumber !== selection.endLineNumber;
    wrapSelection(block ? "```\n" : "`", block ? "\n```" : "`");
  });
  addCommand(keyMod | keyCode.KeyL, () => wrapSelection("[", "](url)"));

  const headingKeys = [
    keyCode.Digit1,
    keyCode.Digit2,
    keyCode.Digit3,
    keyCode.Digit4,
    keyCode.Digit5,
    keyCode.Digit6
  ];
  headingKeys.forEach((key, index) => {
    addCommand(keyMod | key, () => {
      const position = editor.getPosition();
      const model = editor.getModel();
      if (!position || !model) return;
      const line = model.getLineContent(position.lineNumber);
      const text = line.replace(/^#{1,6}\s+/, "");
      editor.executeEdits("markdown-heading", [{
        range: {
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: line.length + 1
        },
        text: `${"#".repeat(index + 1)} ${text}`
      }]);
    });
  });

  if (onSave) {
    addCommand(keyMod | keyCode.KeyS, () => void onSave(editor.getValue()));
  }
  return disposables;
}

function registerListContinuation(
  editor: MonacoEditorInstance,
  monaco: MonacoApi
): MonacoDisposable | undefined {
  const enter = monaco.KeyCode?.Enter;
  if (!enter || !editor.onKeyDown) return undefined;

  return editor.onKeyDown(event => {
    if (event.keyCode !== enter) return;
    const position = editor.getPosition();
    const model = editor.getModel();
    if (!position || !model) return;
    const line = model.getLineContent(position.lineNumber);
    const match = /^(\s*)([-+*]|\d+[.)])\s+(.*)$/.exec(line);
    if (!match) return;

    const indentation = match[1] ?? "";
    const marker = match[2] ?? "-";
    const content = match[3] ?? "";
    event.preventDefault();
    event.stopPropagation?.();

    if (!content.trim()) {
      editor.executeEdits("markdown-list-exit", [{
        range: {
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: line.length + 1
        },
        text: indentation
      }]);
      return;
    }

    const ordered = /^(\d+)([.)])$/.exec(marker);
    const nextMarker = ordered
      ? `${Number.parseInt(ordered[1] ?? "0", 10) + 1}${ordered[2]}`
      : marker;
    const edits: Parameters<MonacoEditorInstance["executeEdits"]>[1] = [{
      range: selectionAt(position),
      text: `\n${indentation}${nextMarker} `,
      forceMoveMarkers: true
    }];

    if (ordered) {
      let expected = Number.parseInt(ordered[1] ?? "0", 10) + 1;
      for (let lineNumber = position.lineNumber + 1; lineNumber <= model.getLineCount(); lineNumber += 1) {
        const following = model.getLineContent(lineNumber);
        const followingMatch = new RegExp(`^${indentation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\d+)([.)])\\s+`).exec(following);
        if (!followingMatch || Number.parseInt(followingMatch[1] ?? "", 10) !== expected) break;
        const oldMarker = `${followingMatch[1]}${followingMatch[2]}`;
        edits.push({
          range: {
            startLineNumber: lineNumber,
            startColumn: indentation.length + 1,
            endLineNumber: lineNumber,
            endColumn: indentation.length + oldMarker.length + 1
          },
          text: `${expected + 1}${followingMatch[2]}`
        });
        expected += 1;
      }
    }
    editor.executeEdits("markdown-list-continue", edits);
  });
}

export async function createMarkdownEditor(
  options: CreateMarkdownEditorOptions
): Promise<MarkdownEditorController> {
  const debounceMs = options.debounceMs ?? 200;
  const form = options.form ?? options.textarea.form ?? undefined;
  const editorPane = options.editorPane ?? options.editorContainer;
  const previewPane = options.previewPane ?? options.previewContainer;
  const controls = Array.from(options.viewModeControls ?? []);
  const originalTextareaDisplay = options.textarea.style.display;
  const originalEditorContainerHidden = options.editorContainer.hidden;
  const originalEditorHidden = editorPane.hidden;
  const originalPreviewHidden = previewPane.hidden;
  const disposables: MonacoDisposable[] = [];
  let uploadController: ImageUploadController | undefined;
  let editor: MonacoEditorInstance | null = null;
  let disposed = false;
  let previewTimer: ReturnType<typeof setTimeout> | undefined;
  let previewGeneration = 0;
  let viewMode: MarkdownViewMode = options.initialViewMode ?? "split";

  const storedMode = options.viewModeStorageKey
    ? globalThis.localStorage?.getItem(options.viewModeStorageKey) ?? null
    : null;
  if (isViewMode(storedMode)) viewMode = storedMode;

  const getValue = (): string => editor?.getValue() ?? options.textarea.value;
  const syncTextarea = (): void => {
    if (editor) options.textarea.value = editor.getValue();
  };

  const refreshPreview = async (): Promise<void> => {
    if (disposed) return;
    const generation = ++previewGeneration;
    const markdown = getValue();
    try {
      options.previewContainer.innerHTML = renderMarkdown(markdown, options.markdownOptions);
      // Mermaid calculates edge and label positions from the rendered element's
      // dimensions. Running it while an editor-only view hides the preview pane
      // can make those dimensions zero and causes Mermaid's layout engine to
      // throw. Keep the hidden preview HTML current, then enhance it after the
      // preview becomes visible in updateMode().
      if (viewMode === "editor") return;
      await enhanceMarkdown({
        container: options.previewContainer,
        hljs: options.hljs,
        mermaid: options.mermaid,
        MathJax: options.MathJax,
        mermaidTheme: options.mermaidTheme
      });
      if (!disposed && generation === previewGeneration) {
        options.onPreviewRendered?.(markdown);
      }
    } catch (error) {
      if (!disposed && generation === previewGeneration) {
        options.onPreviewError?.(error);
        options.onError?.(error);
      }
    }
  };

  const schedulePreview = (): void => {
    if (previewTimer) clearTimeout(previewTimer);
    previewTimer = setTimeout(() => void refreshPreview(), debounceMs);
  };

  const updateMode = async (mode: MarkdownViewMode): Promise<void> => {
    viewMode = mode;
    editorPane.hidden = mode === "preview";
    previewPane.hidden = mode === "editor";
    controls.forEach(control => {
      const active = control.mode === mode;
      control.element.classList.toggle("active", active);
      control.element.setAttribute("aria-pressed", String(active));
      if (control.element instanceof HTMLInputElement) control.element.checked = active;
    });
    if (options.viewModeStorageKey) globalThis.localStorage?.setItem(options.viewModeStorageKey, mode);
    if (mode !== "editor") await refreshPreview();
    editor?.layout();
  };

  controls.forEach(control => {
    const listener = (): void => void updateMode(control.mode);
    control.element.addEventListener("click", listener);
    disposables.push({ dispose: () => control.element.removeEventListener("click", listener) });
  });

  const onTextareaInput = (): void => {
    options.onChange?.(options.textarea.value);
    schedulePreview();
  };
  const onFormSubmit = (): void => syncTextarea();
  options.textarea.addEventListener("input", onTextareaInput);
  form?.addEventListener("submit", onFormSubmit);

  try {
    const monaco = options.monaco ?? await options.loadMonaco?.();
    if (!monaco) throw new Error("Monaco is unavailable. Provide monaco or loadMonaco.");
    editor = monaco.editor.create(options.editorContainer, {
      value: options.textarea.value,
      language: "markdown",
      theme: options.theme ?? "vs",
      automaticLayout: true,
      wordWrap: "on",
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      "semanticHighlighting.enabled": true,
      fontFamily: "'Cascadia Code', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
      fontSize: 14,
      fontLigatures: true,
      padding: { top: 12, bottom: 12 },
      ...options.editorOptions
    });
    options.textarea.style.display = "none";
    disposables.push(editor.onDidChangeModelContent(() => {
      syncTextarea();
      options.onChange?.(editor?.getValue() ?? options.textarea.value);
      schedulePreview();
    }));
    disposables.push(...registerShortcuts(editor, monaco, options.onSave));
    const listDisposable = registerListContinuation(editor, monaco);
    if (listDisposable) disposables.push(listDisposable);
    if (options.uploadUrl) {
      uploadController = attachImageUpload({
        ...options.imageUploadOptions,
        editor,
        uploadUrl: options.uploadUrl,
        eventTarget: options.editorContainer.parentElement ?? options.editorContainer
      });
    }
  } catch (error) {
    editor?.dispose();
    editor = null;
    options.textarea.style.removeProperty("display");
    options.editorContainer.hidden = true;
    options.onInitializationError?.(error);
    options.onError?.(error);
  }

  await updateMode(viewMode);
  if (!editor) options.editorContainer.hidden = true;

  return {
    get editor() {
      return editor;
    },
    get isFallback() {
      return editor === null;
    },
    getValue,
    syncTextarea,
    setValue(markdown) {
      if (editor) editor.setValue(markdown);
      options.textarea.value = markdown;
      options.onChange?.(markdown);
      schedulePreview();
    },
    focus() {
      if (editor) editor.focus();
      else options.textarea.focus();
    },
    getViewMode() {
      return viewMode;
    },
    setViewMode: updateMode,
    refreshPreview,
    dispose() {
      if (disposed) return;
      disposed = true;
      if (previewTimer) clearTimeout(previewTimer);
      uploadController?.dispose();
      disposables.forEach(disposable => disposable.dispose());
      editor?.dispose();
      options.textarea.removeEventListener("input", onTextareaInput);
      form?.removeEventListener("submit", onFormSubmit);
      options.textarea.style.display = originalTextareaDisplay;
      options.editorContainer.hidden = originalEditorContainerHidden;
      editorPane.hidden = originalEditorHidden;
      previewPane.hidden = originalPreviewHidden;
    }
  };
}
