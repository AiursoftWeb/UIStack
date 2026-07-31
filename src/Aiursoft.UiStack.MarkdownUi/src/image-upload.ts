export interface EditorPosition {
  lineNumber: number;
  column: number;
}

export interface MarkdownEditor {
  getPosition(): EditorPosition | null;
  executeEdits(source: string, edits: Array<{
    range: {
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
    };
    text: string;
    forceMoveMarkers?: boolean;
  }>): void;
  getValue(): string;
  setValue(value: string): void;
  getDomNode?(): HTMLElement | null;
}

export interface ImageUploadOptions {
  editor: MarkdownEditor;
  uploadUrl: string;
  eventTarget?: HTMLElement;
  fieldName?: string;
  concurrency?: number;
  maxRetries?: number;
  fetch?: typeof globalThis.fetch;
  getImageUrl?: (response: unknown) => string;
  onError?: (error: unknown, file: File) => void;
}

export interface ImageUploadController {
  upload(files: Iterable<File>): Promise<void>;
  dispose(): void;
}

const imageFiles = (files: Iterable<File>): File[] =>
  Array.from(files).filter(file => file.type.startsWith("image/"));

function clipboardImageFiles(data: DataTransfer | null): File[] {
  if (!data) return [];
  const files = imageFiles(data.files);
  if (files.length > 0) return files;
  return Array.from(data.items)
    .filter(item => item.kind === "file")
    .map(item => item.getAsFile())
    .filter((file): file is File => file !== null && file.type.startsWith("image/"));
}

function replaceOnce(editor: MarkdownEditor, marker: string, value: string): void {
  editor.setValue(editor.getValue().replace(marker, value));
}

function retryDelay(response: Response, attempt: number): number {
  const header = response.headers.get("Retry-After");
  const seconds = header ? Number.parseInt(header, 10) : Number.NaN;
  return Number.isFinite(seconds) ? seconds * 1000 : Math.min(60_000, 1000 * 2 ** attempt);
}

export function attachImageUpload(options: ImageUploadOptions): ImageUploadController {
  const fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
  const fieldName = options.fieldName ?? "file";
  const concurrency = options.concurrency ?? 3;
  const maxRetries = options.maxRetries ?? 5;
  const getImageUrl = options.getImageUrl ?? ((response: unknown) => {
    const value = response as { internetPath?: string; InternetPath?: string };
    return value.internetPath ?? value.InternetPath ?? "";
  });

  const uploadOne = async (file: File, marker: string): Promise<void> => {
    try {
      for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        const form = new FormData();
        form.append(fieldName, file, file.name);
        const response = await fetcher(options.uploadUrl, { method: "POST", body: form });
        if (response.ok) {
          const url = getImageUrl(await response.json());
          if (!url) throw new Error("The upload response did not contain an image URL.");
          replaceOnce(options.editor, marker, `![${file.name}](${url})`);
          return;
        }
        if (response.status !== 429 || attempt === maxRetries) {
          throw new Error(`Image upload failed with HTTP ${response.status}.`);
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay(response, attempt)));
      }
    } catch (error) {
      replaceOnce(options.editor, marker, "");
      options.onError?.(error, file);
    }
  };

  const upload = async (files: Iterable<File>): Promise<void> => {
    const images = imageFiles(files);
    if (images.length === 0) return;
    const position = options.editor.getPosition() ?? { lineNumber: 1, column: 1 };
    const jobs = images.map((file, index) => {
      const marker = `![Uploading ${file.name}…](aiur-upload://${crypto.randomUUID()})`;
      options.editor.executeEdits("markdown-image-upload", [{
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        },
        text: `${index === 0 ? "" : "\n"}${marker}`,
        forceMoveMarkers: true
      }]);
      return { file, marker };
    });
    let next = 0;
    const worker = async (): Promise<void> => {
      while (next < jobs.length) {
        const job = jobs[next++];
        if (job) await uploadOne(job.file, job.marker);
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));
  };

  const editorRoot = options.eventTarget ?? options.editor.getDomNode?.();

  // Paste listener on document (capture phase) guarantees interception before
  // any child element -- including Monaco's internal textarea -- processes the
  // paste event. The containment check limits processing to this editor instance.
  const onDocumentPaste = (event: ClipboardEvent): void => {
    if (!editorRoot?.contains(event.target as Node)) return;
    const files = clipboardImageFiles(event.clipboardData);
    if (files.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      void upload(files);
    }
  };

  document.addEventListener("paste", onDocumentPaste, true);

  const onDragOver = (event: DragEvent): void => {
    if (event.dataTransfer && imageFiles(event.dataTransfer.files).length > 0) event.preventDefault();
  };
  const onDrop = (event: DragEvent): void => {
    const files = event.dataTransfer?.files;
    if (files && imageFiles(files).length > 0) {
      event.preventDefault();
      void upload(files);
    }
  };

  editorRoot?.addEventListener("dragover", onDragOver);
  editorRoot?.addEventListener("drop", onDrop);

  return {
    upload,
    dispose() {
      document.removeEventListener("paste", onDocumentPaste, true);
      editorRoot?.removeEventListener("dragover", onDragOver);
      editorRoot?.removeEventListener("drop", onDrop);
    }
  };
}
