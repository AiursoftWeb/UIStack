import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMarkdownEditor,
  loadMonacoFromAmd,
  type MonacoApi,
  type MonacoEditorInstance,
  type MonacoKeyboardEvent,
  type MonacoSelection
} from "../src";

interface FakeEditor extends MonacoEditorInstance {
  value: string;
  selection: MonacoSelection;
  change(): void;
  keyDown(event: MonacoKeyboardEvent): void;
  commands: Map<number, () => void>;
}

function offsetAt(value: string, lineNumber: number, column: number): number {
  const lines = value.split("\n");
  return lines.slice(0, lineNumber - 1).reduce((sum, line) => sum + line.length + 1, 0) + column - 1;
}

function fakeMonaco(): { monaco: MonacoApi; editor: FakeEditor } {
  let changeHandler = (): void => {};
  let keyHandler = (_event: MonacoKeyboardEvent): void => {};
  const commands = new Map<number, () => void>();
  const domNode = document.createElement("div");
  const editor: FakeEditor = {
    value: "",
    selection: {
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 1
    },
    commands,
    getValue() {
      return this.value;
    },
    setValue(value) {
      this.value = value;
      changeHandler();
    },
    getPosition() {
      return {
        lineNumber: this.selection.endLineNumber,
        column: this.selection.endColumn
      };
    },
    getSelection() {
      return this.selection;
    },
    getModel() {
      return {
        getLineContent: line => this.value.split("\n")[line - 1] ?? "",
        getLineCount: () => this.value.split("\n").length,
        getValueInRange: selection => {
          const start = offsetAt(this.value, selection.startLineNumber, selection.startColumn);
          const end = offsetAt(this.value, selection.endLineNumber, selection.endColumn);
          return this.value.slice(start, end);
        }
      };
    },
    getDomNode: () => domNode,
    executeEdits(_source, edits) {
      const sorted = [...edits].sort((left, right) =>
        offsetAt(this.value, right.range.startLineNumber, right.range.startColumn)
        - offsetAt(this.value, left.range.startLineNumber, left.range.startColumn));
      sorted.forEach(edit => {
        const start = offsetAt(this.value, edit.range.startLineNumber, edit.range.startColumn);
        const end = offsetAt(this.value, edit.range.endLineNumber, edit.range.endColumn);
        this.value = this.value.slice(0, start) + edit.text + this.value.slice(end);
      });
      changeHandler();
    },
    onDidChangeModelContent(callback) {
      changeHandler = callback;
      return { dispose: vi.fn() };
    },
    onKeyDown(callback) {
      keyHandler = callback;
      return { dispose: vi.fn() };
    },
    addCommand(keybinding, callback) {
      commands.set(keybinding, callback);
      return String(keybinding);
    },
    focus: vi.fn(),
    layout: vi.fn(),
    dispose: vi.fn(),
    change() {
      changeHandler();
    },
    keyDown(event) {
      keyHandler(event);
    }
  };
  const monaco: MonacoApi = {
    editor: {
      create(_container, options) {
        editor.value = String(options.value ?? "");
        return editor;
      }
    },
    KeyMod: { CtrlCmd: 1024 },
    KeyCode: {
      Enter: 3,
      KeyB: 31,
      KeyI: 38,
      KeyK: 40,
      KeyL: 41,
      KeyS: 48,
      Digit1: 22,
      Digit2: 23,
      Digit3: 24,
      Digit4: 25,
      Digit5: 26,
      Digit6: 27
    }
  };
  return { monaco, editor };
}

function elements() {
  document.body.innerHTML = `
    <form>
      <section id="editor-pane"><div id="editor"></div><textarea>## Initial</textarea></section>
      <section id="preview"></section>
      <button type="button" id="preview-mode"></button>
    </form>`;
  return {
    form: document.querySelector("form")!,
    editorPane: document.querySelector<HTMLElement>("#editor-pane")!,
    editorContainer: document.querySelector<HTMLElement>("#editor")!,
    textarea: document.querySelector("textarea")!,
    preview: document.querySelector<HTMLElement>("#preview")!,
    previewButton: document.querySelector<HTMLElement>("#preview-mode")!
  };
}

describe("createMarkdownEditor", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("initializes Monaco, renders preview, syncs changes and disposes", async () => {
    vi.useFakeTimers();
    const nodes = elements();
    const { monaco, editor } = fakeMonaco();
    const onChange = vi.fn();
    const controller = await createMarkdownEditor({
      ...nodes,
      previewContainer: nodes.preview,
      monaco,
      debounceMs: 10,
      onChange
    });

    expect(controller.isFallback).toBe(false);
    expect(nodes.textarea.style.display).toBe("none");
    expect(nodes.preview.innerHTML).toContain("<h2>Initial</h2>");

    editor.value = "**Changed**";
    editor.change();
    await vi.advanceTimersByTimeAsync(10);
    expect(nodes.textarea.value).toBe("**Changed**");
    expect(nodes.preview.innerHTML).toContain("<strong>Changed</strong>");
    expect(onChange).toHaveBeenCalledWith("**Changed**");
    controller.syncTextarea();
    expect(nodes.textarea.value).toBe("**Changed**");

    controller.dispose();
    expect(editor.dispose).toHaveBeenCalledOnce();
    expect(nodes.textarea.style.display).toBe("");
  });

  it("loads Monaco through the shared AMD loader", async () => {
    const { monaco } = fakeMonaco();
    const originalMonaco = (globalThis as typeof globalThis & { monaco?: MonacoApi }).monaco;
    (globalThis as typeof globalThis & { monaco?: MonacoApi }).monaco = monaco;
    const amdRequire = vi.fn((_dependencies, onLoad: () => void) => onLoad());

    await expect(loadMonacoFromAmd(amdRequire)).resolves.toBe(monaco);
    expect(amdRequire).toHaveBeenCalledWith(
      ["vs/editor/editor.main"],
      expect.any(Function),
      expect.any(Function)
    );
    (globalThis as typeof globalThis & { monaco?: MonacoApi }).monaco = originalMonaco;
  });

  it("uses the textarea as a functional fallback when Monaco fails", async () => {
    vi.useFakeTimers();
    const nodes = elements();
    nodes.textarea.style.display = "none";
    const onInitializationError = vi.fn();
    const onPreviewError = vi.fn();
    const controller = await createMarkdownEditor({
      editorContainer: nodes.editorContainer,
      textarea: nodes.textarea,
      previewContainer: nodes.preview,
      loadMonaco: async () => {
        throw new Error("load failed");
      },
      debounceMs: 5,
      onInitializationError,
      onPreviewError
    });

    expect(controller.isFallback).toBe(true);
    expect(nodes.textarea.style.display).toBe("");
    expect(nodes.editorContainer.hidden).toBe(true);
    nodes.textarea.value = "# Fallback";
    nodes.textarea.dispatchEvent(new Event("input"));
    await vi.advanceTimersByTimeAsync(5);
    expect(nodes.preview.innerHTML).toContain("<h1>Fallback</h1>");
    expect(onInitializationError).toHaveBeenCalledOnce();
    expect(onPreviewError).not.toHaveBeenCalled();
  });

  it("reports preview errors without replacing Monaco with the textarea fallback", async () => {
    const nodes = elements();
    const { monaco } = fakeMonaco();
    const previewError = new Error("Mermaid failed");
    const onInitializationError = vi.fn();
    const onPreviewError = vi.fn();
    const controller = await createMarkdownEditor({
      editorContainer: nodes.editorContainer,
      textarea: nodes.textarea,
      previewContainer: nodes.preview,
      monaco,
      mermaid: {
        initialize: vi.fn(),
        run: vi.fn(async () => {
          throw previewError;
        })
      },
      onInitializationError,
      onPreviewError
    });

    controller.setValue("```mermaid\ngraph TD\nA --> B\n```");
    await controller.refreshPreview();

    expect(controller.isFallback).toBe(false);
    expect(nodes.textarea.style.display).toBe("none");
    expect(nodes.editorContainer.hidden).toBe(false);
    expect(onInitializationError).not.toHaveBeenCalled();
    expect(onPreviewError).toHaveBeenCalledWith(previewError);
  });

  it("persists view modes and refreshes preview when it becomes visible", async () => {
    const nodes = elements();
    const { monaco } = fakeMonaco();
    const onPreviewRendered = vi.fn();
    const controller = await createMarkdownEditor({
      editorContainer: nodes.editorContainer,
      editorPane: nodes.editorPane,
      textarea: nodes.textarea,
      previewContainer: nodes.preview,
      previewPane: nodes.preview,
      monaco,
      initialViewMode: "editor",
      viewModeStorageKey: "markdown-mode",
      viewModeControls: [{ element: nodes.previewButton, mode: "preview" }],
      onPreviewRendered
    });

    expect(nodes.preview.hidden).toBe(true);
    nodes.previewButton.click();
    await vi.waitFor(() => expect(controller.getViewMode()).toBe("preview"));
    expect(nodes.editorPane.hidden).toBe(true);
    expect(nodes.preview.hidden).toBe(false);
    expect(localStorage.getItem("markdown-mode")).toBe("preview");
    expect(nodes.previewButton.classList.contains("active")).toBe(true);
    expect(onPreviewRendered).toHaveBeenCalled();
  });

  it("defers Mermaid enhancement until the preview pane is visible", async () => {
    vi.useFakeTimers();
    const nodes = elements();
    const { monaco, editor } = fakeMonaco();
    const mermaid = {
      initialize: vi.fn(),
      run: vi.fn(async () => undefined)
    };
    const controller = await createMarkdownEditor({
      editorContainer: nodes.editorContainer,
      editorPane: nodes.editorPane,
      textarea: nodes.textarea,
      previewContainer: nodes.preview,
      previewPane: nodes.preview,
      monaco,
      mermaid,
      debounceMs: 5,
      initialViewMode: "editor"
    });

    editor.value = "```mermaid\ngraph TD\nA --> B\n```";
    editor.change();
    await vi.advanceTimersByTimeAsync(5);

    expect(nodes.preview.hidden).toBe(true);
    expect(nodes.preview.querySelector("code.language-mermaid")).not.toBeNull();
    expect(mermaid.run).not.toHaveBeenCalled();

    await controller.setViewMode("preview");

    expect(nodes.preview.hidden).toBe(false);
    expect(mermaid.run).toHaveBeenCalledOnce();
  });

  it("registers Markdown shortcuts, save and ordered-list continuation", async () => {
    const nodes = elements();
    nodes.textarea.value = "text";
    const { monaco, editor } = fakeMonaco();
    const onSave = vi.fn();
    await createMarkdownEditor({
      editorContainer: nodes.editorContainer,
      textarea: nodes.textarea,
      previewContainer: nodes.preview,
      monaco,
      onSave
    });

    editor.selection = {
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 5
    };
    editor.commands.get(1024 | 31)?.();
    expect(editor.value).toBe("**text**");

    editor.commands.get(1024 | 48)?.();
    expect(onSave).toHaveBeenCalledWith("**text**");

    editor.value = "1. first\n2. second";
    editor.selection = {
      startLineNumber: 1,
      startColumn: 9,
      endLineNumber: 1,
      endColumn: 9
    };
    const event = {
      keyCode: 3,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    };
    editor.keyDown(event);
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(editor.value).toBe("1. first\n2. \n3. second");
  });

  it("syncs the textarea before form submission", async () => {
    const nodes = elements();
    const { monaco, editor } = fakeMonaco();
    await createMarkdownEditor({
      editorContainer: nodes.editorContainer,
      textarea: nodes.textarea,
      previewContainer: nodes.preview,
      form: nodes.form,
      monaco
    });
    editor.value = "saved value";

    nodes.form.dispatchEvent(new Event("submit"));

    expect(nodes.textarea.value).toBe("saved value");
  });
});
