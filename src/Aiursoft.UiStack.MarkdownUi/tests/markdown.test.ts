import { describe, expect, it } from "vitest";
import { createMarkdownIt, renderMarkdown } from "../src";

describe("Markdown rendering", () => {
  it("disables native HTML", () => {
    expect(renderMarkdown("<script>alert(1)</script>")).not.toContain("<script>");
  });

  it("highlights known languages and leaves Mermaid for Mermaid", () => {
    const html = renderMarkdown("```csharp\nvar answer = 42;\n```\n\n```mermaid\ngraph TD; A-->B\n```");
    expect(html).toContain("hljs language-csharp");
    expect(html).toContain("language-mermaid");
    expect(html).not.toContain("hljs language-mermaid");
    expect(html).not.toContain("<code><code");
    expect(html.match(/<pre/g)).toHaveLength(2);
  });

  it("supports inline and block MathJax delimiters", () => {
    const html = createMarkdownIt().render("Value: $x^2$\n\n$$\ny = x + 1\n$$");
    expect(html).toContain("\\(x^2\\)");
    expect(html).toContain("\\[");
    expect(html).toContain("y = x + 1");
  });

  it("preserves explicit MathJax delimiters", () => {
    const html = renderMarkdown("Inline: \\(x + 1\\)\n\n\\[y = 2\\]");
    expect(html).toContain("\\(x + 1\\)");
    expect(html).toContain("\\[y = 2\\]");
  });
});
