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
});
