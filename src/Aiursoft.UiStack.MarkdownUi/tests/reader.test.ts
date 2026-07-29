import { describe, expect, it, vi } from "vitest";
import { enhanceMarkdown, initializeMarkdownReader } from "../src";

describe("Markdown reader", () => {
  it("scopes highlighting and renders Mermaid in strict mode", async () => {
    document.body.innerHTML = `
      <main id="markdown"><pre><code class="language-csharp">var x = 1;</code></pre>
      <pre><code class="language-mermaid">graph TD; A--&gt;B</code></pre></main>
      <pre><code id="outside">outside</code></pre>`;
    const highlightElement = vi.fn();
    const initialize = vi.fn();
    const run = vi.fn().mockResolvedValue(undefined);
    const typesetPromise = vi.fn().mockResolvedValue(undefined);

    await enhanceMarkdown({
      container: "#markdown",
      hljs: { highlightElement },
      mermaid: { initialize, run },
      MathJax: { typesetPromise }
    });

    expect(highlightElement).toHaveBeenCalledTimes(1);
    expect(highlightElement).not.toHaveBeenCalledWith(document.querySelector("#outside"));
    expect(initialize).toHaveBeenCalledWith(expect.objectContaining({ securityLevel: "strict" }));
    expect(run).toHaveBeenCalledOnce();
    expect(document.querySelector("#markdown .mermaid")?.textContent).toContain("graph TD");
    expect(typesetPromise).toHaveBeenCalledOnce();
  });

  it("uses the shared reader decorations for tables and links", async () => {
    document.body.innerHTML = `
      <main id="markdown">
        <table><tbody><tr><td>value</td></tr></tbody></table>
        <a href="https://www.aiursoft.com/">Aiursoft</a>
      </main>`;

    await initializeMarkdownReader({ container: "#markdown" });

    const table = document.querySelector("table")!;
    expect(table.classList.contains("table")).toBe(true);
    expect(table.parentElement?.classList.contains("table-responsive")).toBe(true);
    const link = document.querySelector("a")!;
    expect(link.target).toBe("_blank");
    expect(link.rel).toContain("noopener");
    expect(link.rel).toContain("noreferrer");
  });
});
