# @aiursoft/uistack-markdown-ui

Shared Markdown UI behavior for Aiursoft applications.

- Secure `markdown-it` rendering with native HTML disabled
- highlight.js 11.11.1 highlighting
- Mermaid 11 enhancement with `securityLevel: "strict"`
- MathJax 3 enhancement and print coordination
- Monaco-compatible paste and drag/drop image upload
- Shared Monaco editor lifecycle, shortcuts, preview, view modes and textarea fallback

## Install

```bash
npm install @aiursoft/uistack-markdown-ui
```

## Editor preview

```js
import { renderMarkdown } from "@aiursoft/uistack-markdown-ui";

preview.innerHTML = renderMarkdown(editor.getValue());
```

The renderer supports `$...$`, `$$...$$`, `\\(...\\)` and `\\[...\\]`. Native HTML is
always escaped. A fenced `mermaid` block remains unhighlighted for Mermaid to process.

## Complete Markdown editor

`createMarkdownEditor` owns the common editor behavior while the application remains
responsible for loading Monaco. Passing a loader instead of importing Monaco keeps it
out of application bundles and works with the standard Monaco AMD loader.

```js
import { createMarkdownEditor } from "@aiursoft/uistack-markdown-ui";

const markdownEditor = await createMarkdownEditor({
  editorContainer: document.querySelector("#markdown-editor"),
  textarea: document.querySelector("#markdown-source"),
  previewContainer: document.querySelector("#markdown-preview"),
  editorPane: document.querySelector("#editor-pane"),
  previewPane: document.querySelector("#preview-pane"),
  form: document.querySelector("form"),
  loadMonaco: () => new Promise((resolve, reject) => {
    window.require(
      ["vs/editor/editor.main"],
      () => resolve(window.monaco),
      reject
    );
  }),
  theme: "vs-dark",
  uploadUrl: "/api/files/upload",
  initialViewMode: "split",
  viewModeStorageKey: "markdown-view-mode",
  viewModeControls: [
    { element: document.querySelector("#edit-mode"), mode: "editor" },
    { element: document.querySelector("#split-mode"), mode: "split" },
    { element: document.querySelector("#preview-mode"), mode: "preview" }
  ],
  hljs,
  mermaid,
  MathJax,
  onSave: markdown => saveMarkdown(markdown),
  onError: error => console.error(error)
});

await markdownEditor.setViewMode("preview");
markdownEditor.setValue("# Updated");
markdownEditor.focus();
markdownEditor.dispose();
```

The controller initializes Monaco for Markdown, keeps the original textarea synchronized,
debounces secure preview rendering, enhances highlight.js/Mermaid/MathJax, supports image
paste and drop, and registers consistent Markdown shortcuts:

- <kbd>Ctrl/Cmd+B</kbd>: bold
- <kbd>Ctrl/Cmd+I</kbd>: italic
- <kbd>Ctrl/Cmd+K</kbd>: inline or fenced code
- <kbd>Ctrl/Cmd+L</kbd>: link
- <kbd>Ctrl/Cmd+1</kbd> through <kbd>Ctrl/Cmd+6</kbd>: headings
- <kbd>Ctrl/Cmd+S</kbd>: `onSave`
- <kbd>Enter</kbd>: continue bullet and ordered lists

If Monaco cannot be loaded, the original textarea becomes visible and continues to drive
the same preview. Applications therefore use one fallback policy instead of implementing
their own.

## Reading pages

```js
import { enhanceMarkdown, printMarkdown } from "@aiursoft/uistack-markdown-ui";

await enhanceMarkdown({
  container: ".markdown-body",
  hljs,
  mermaid,
  MathJax
});

printButton.addEventListener("click", () =>
  printMarkdown({ container: ".markdown-body", hljs, mermaid, MathJax }));
```

Only code blocks inside the supplied container are highlighted. Mermaid is always
initialized in strict security mode.

## Image paste and drop

```js
import { attachImageUpload } from "@aiursoft/uistack-markdown-ui";

const uploads = attachImageUpload({
  editor,
  uploadUrl: "/api/files/upload",
  onError: (error, file) => console.error(`Failed to upload ${file.name}`, error)
});

// Call uploads.dispose() when the editor is destroyed.
```

The default queue uploads three files concurrently and retries HTTP 429 responses up
to five times. Use `getImageUrl` when an endpoint does not return `internetPath` or
`InternetPath`.
