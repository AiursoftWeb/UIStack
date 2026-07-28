# @aiursoft/uistack-markdown-ui

Shared Markdown UI behavior for Aiursoft applications.

- Secure `markdown-it` rendering with native HTML disabled
- highlight.js 11.11.1 highlighting
- Mermaid 11 enhancement with `securityLevel: "strict"`
- MathJax 3 enhancement and print coordination
- Monaco-compatible paste and drag/drop image upload

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
