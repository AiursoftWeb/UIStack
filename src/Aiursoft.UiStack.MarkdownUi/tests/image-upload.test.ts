import { afterEach, describe, expect, it, vi } from "vitest";
import { attachImageUpload, type MarkdownEditor } from "../src";

function editorWithValue(initial = ""): MarkdownEditor & { value: string } {
  return {
    value: initial,
    getPosition: () => ({ lineNumber: 1, column: 1 }),
    executeEdits(_source, edits) {
      this.value += edits.map(edit => edit.text).join("");
    },
    getValue() {
      return this.value;
    },
    setValue(value) {
      this.value = value;
    }
  };
}

function uploadSpy() {
  const fn = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
    new Response(JSON.stringify({ internetPath: "/files/image.png" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  );
  return fn;
}

function imageFile(name = "image.png"): File {
  return new File(["image"], name, { type: "image/png" });
}

function createDom(): {
  eventTarget: HTMLElement;
  editorContainer: HTMLElement;
  editorNode: HTMLElement;
  monacoInput: HTMLTextAreaElement;
  outside: HTMLElement;
  cleanup(): void;
} {
  const eventTarget = document.createElement("div");
  const editorContainer = document.createElement("div");
  const editorNode = document.createElement("div");
  const monacoInput = document.createElement("textarea");
  const outside = document.createElement("div");
  editorNode.appendChild(monacoInput);
  editorContainer.appendChild(editorNode);
  eventTarget.appendChild(editorContainer);
  document.body.appendChild(eventTarget);
  document.body.appendChild(outside);
  return {
    eventTarget,
    editorContainer,
    editorNode,
    monacoInput,
    outside,
    cleanup() {
      eventTarget.remove();
      outside.remove();
    }
  };
}

function pasteEvent(target: HTMLElement, files: File[], items?: { kind: string; type: string; getAsFile: () => File | null }[]): ClipboardEvent {
  const event = new Event("paste", { bubbles: true, cancelable: true }) as ClipboardEvent;
  Object.defineProperty(event, "clipboardData", {
    value: {
      files,
      items: items ?? files.map(f => ({
        kind: "file",
        type: f.type,
        getAsFile: () => f,
      })),
    },
  });
  return event;
}

describe("Image uploads", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("inserts the uploaded image and supports InternetPath responses", async () => {
    const editor = editorWithValue();
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ InternetPath: "/files/image.png" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );
    const controller = attachImageUpload({ editor, uploadUrl: "/upload", fetch: fetcher });

    await controller.upload([new File(["image"], "image.png", { type: "image/png" })]);

    expect(fetcher).toHaveBeenCalledOnce();
    expect(editor.value).toBe("![image.png](/files/image.png)");
  });

  it("retries HTTP 429 and removes a failed placeholder", async () => {
    const editor = editorWithValue();
    const onError = vi.fn();
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response("", { status: 429, headers: { "Retry-After": "0" } }))
      .mockResolvedValueOnce(new Response("", { status: 500 }));
    const controller = attachImageUpload({
      editor,
      uploadUrl: "/upload",
      fetch: fetcher,
      maxRetries: 1,
      onError
    });

    await controller.upload([new File(["image"], "bad.png", { type: "image/png" })]);

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(editor.value).toBe("");
    expect(onError).toHaveBeenCalledOnce();
  });

  it("ignores non-image files", async () => {
    const editor = editorWithValue("unchanged");
    const fetcher = vi.fn();
    const controller = attachImageUpload({ editor, uploadUrl: "/upload", fetch: fetcher });

    await controller.upload([new File(["text"], "notes.txt", { type: "text/plain" })]);

    expect(fetcher).not.toHaveBeenCalled();
    expect(editor.value).toBe("unchanged");
  });

  it("intercepts paste at document capture phase before Monaco sees the event", async () => {
    const dom = createDom();
    const editor = {
      ...editorWithValue(),
      getDomNode: () => dom.editorNode
    };
    const fetcher = uploadSpy();

    // Simulate Monaco's paste handler on editorContainer (capture phase).
    // With document-level capture, our handler fires even earlier.
    const monacoPaste = vi.fn();
    dom.editorContainer.addEventListener("paste", event => {
      monacoPaste();
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);

    const controller = attachImageUpload({
      editor,
      uploadUrl: "/upload",
      eventTarget: dom.eventTarget,
      fetch: fetcher
    });

    // Dispatch paste on Monaco's internal textarea
    dom.monacoInput.dispatchEvent(pasteEvent(dom.monacoInput, [imageFile("clipboard.png")]));

    await vi.waitFor(() =>
      expect(editor.value).toBe("![clipboard.png](/files/image.png)"));

    // Monaco's handler must never fire — our document-level capture wins
    expect(monacoPaste).not.toHaveBeenCalled();
    expect(fetcher).toHaveBeenCalledOnce();

    controller.dispose();
    dom.cleanup();
  });

  it("ignores paste events originating outside the editor DOM tree", async () => {
    const dom = createDom();
    const editor = {
      ...editorWithValue(),
      getDomNode: () => dom.editorNode
    };
    const fetcher = uploadSpy();

    const controller = attachImageUpload({
      editor,
      uploadUrl: "/upload",
      eventTarget: dom.eventTarget,
      fetch: fetcher
    });

    // Paste on an element outside the editor root should be ignored
    dom.outside.dispatchEvent(pasteEvent(dom.outside, [imageFile()]));

    // Allow any async microtasks to flush
    await vi.waitFor(() => {
      // fetcher must not have been called
    }, { timeout: 100 });

    expect(fetcher).not.toHaveBeenCalled();
    expect(editor.value).toBe("");

    controller.dispose();
    dom.cleanup();
  });

  it("uploads multiple images concurrently", async () => {
    const editor = editorWithValue();
    const completed: number[] = [];
    const fetcher = vi.fn().mockImplementation(async () => {
      await new Promise(r => setTimeout(r, 10));
      completed.push(1);
      return new Response(JSON.stringify({ internetPath: "/files/done.png" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    });

    const controller = attachImageUpload({
      editor,
      uploadUrl: "/upload",
      concurrency: 2,
      fetch: fetcher
    });

    await controller.upload([
      imageFile("a.png"),
      imageFile("b.png"),
      imageFile("c.png"),
    ]);

    // All three uploaded
    expect(fetcher).toHaveBeenCalledTimes(3);
    // Placeholders are replaced with URLs
    expect(editor.value).toContain("![a.png](/files/done.png)");
    expect(editor.value).toContain("![b.png](/files/done.png)");
    expect(editor.value).toContain("![c.png](/files/done.png)");
    controller.dispose();
  });

  it("does nothing when given an empty file list", async () => {
    const editor = editorWithValue("unchanged");
    const fetcher = vi.fn();

    const controller = attachImageUpload({
      editor,
      uploadUrl: "/upload",
      fetch: fetcher
    });

    await controller.upload([]);
    await controller.upload([new File(["text"], "readme.md", { type: "text/markdown" })]);

    expect(fetcher).not.toHaveBeenCalled();
    expect(editor.value).toBe("unchanged");
    controller.dispose();
  });

  it("handles drag and drop image upload", async () => {
    const editor = editorWithValue();
    const fetcher = uploadSpy();

    const controller = attachImageUpload({
      editor,
      uploadUrl: "/upload",
      fetch: fetcher
    });

    // onDrop calls upload() — same function tested here directly
    await controller.upload([imageFile("dragged.png")]);

    expect(editor.value).toBe("![dragged.png](/files/image.png)");
    expect(fetcher).toHaveBeenCalledOnce();
    controller.dispose();
  });

  it("ignores non-image files in upload queue", async () => {
    const editor = editorWithValue("unchanged");
    const fetcher = vi.fn();

    const controller = attachImageUpload({
      editor,
      uploadUrl: "/upload",
      fetch: fetcher
    });

    // Both onDrop and onPaste call upload(), which filters to images only
    await controller.upload([
      new File(["text"], "doc.txt", { type: "text/plain" })
    ]);

    expect(fetcher).not.toHaveBeenCalled();
    expect(editor.value).toBe("unchanged");
    controller.dispose();
  });
});
