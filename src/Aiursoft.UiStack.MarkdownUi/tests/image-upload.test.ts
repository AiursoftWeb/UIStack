import { describe, expect, it, vi } from "vitest";
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

describe("Image uploads", () => {
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

  it("captures pasted images from an ancestor before Monaco's earlier host capture listener", async () => {
    const eventTarget = document.createElement("div");
    const editorContainer = document.createElement("div");
    const editorNode = document.createElement("div");
    const monacoInput = document.createElement("textarea");
    editorNode.appendChild(monacoInput);
    editorContainer.appendChild(editorNode);
    eventTarget.appendChild(editorContainer);
    document.body.appendChild(eventTarget);
    const editor = {
      ...editorWithValue(),
      getDomNode: () => editorNode
    };
    const pastedImage = new File(["image"], "clipboard.png", { type: "image/png" });
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ internetPath: "/files/clipboard.png" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );
    const monacoPaste = vi.fn();
    // Monaco's getContainerDomNode() is the host passed to editor.create(),
    // and its listener is registered before attachImageUpload().
    editorContainer.addEventListener("paste", event => {
      monacoPaste();
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    attachImageUpload({
      editor,
      uploadUrl: "/upload",
      eventTarget,
      fetch: fetcher
    });
    const paste = new Event("paste", { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(paste, "clipboardData", {
      value: {
        files: [],
        items: [{
          kind: "file",
          type: "image/png",
          getAsFile: () => pastedImage
        }]
      }
    });

    monacoInput.dispatchEvent(paste);
    await vi.waitFor(() =>
      expect(editor.value).toBe("![clipboard.png](/files/clipboard.png)"));

    expect(paste.defaultPrevented).toBe(true);
    expect(monacoPaste).not.toHaveBeenCalled();
    expect(fetcher).toHaveBeenCalledOnce();
  });
});
