import hljs from "highlight.js";
import MarkdownIt from "markdown-it";
import type { Options } from "markdown-it";

export interface MarkdownOptions {
  breaks?: boolean;
  linkify?: boolean;
  typographer?: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function mathPlugin(md: MarkdownIt): void {
  md.inline.ruler.before("escape", "math_parentheses", (state, silent) => {
    if (state.src.slice(state.pos, state.pos + 2) !== "\\(") return false;
    const end = state.src.indexOf("\\)", state.pos + 2);
    if (end < 0) return false;
    if (!silent) {
      const token = state.push("math_inline", "span", 0);
      token.content = state.src.slice(state.pos + 2, end);
    }
    state.pos = end + 2;
    return true;
  });
  md.inline.ruler.after("escape", "math_inline", (state, silent) => {
    const marker = state.src[state.pos];
    if (marker !== "$" || state.src[state.pos + 1] === "$") return false;
    const end = state.src.indexOf("$", state.pos + 1);
    if (end < 0 || state.src[end - 1] === "\\") return false;
    if (!silent) {
      const token = state.push("math_inline", "span", 0);
      token.content = state.src.slice(state.pos + 1, end);
    }
    state.pos = end + 1;
    return true;
  });
  md.renderer.rules.math_inline = (tokens, index) =>
    `<span class="math-inline">\\(${escapeHtml(tokens[index]!.content)}\\)</span>`;

  md.block.ruler.after("blockquote", "math_block", (state, start, end, silent) => {
    const first = state.bMarks[start]! + state.tShift[start]!;
    const line = state.src.slice(first, state.eMarks[start]!);
    if (!line.startsWith("$$")) return false;
    let content = line.slice(2);
    let next = start;
    if (!content.trimEnd().endsWith("$$")) {
      for (next = start + 1; next < end; next += 1) {
        const value = state.src.slice(state.bMarks[next]! + state.tShift[next]!, state.eMarks[next]!);
        if (value.trimEnd().endsWith("$$")) {
          content += `\n${value.trimEnd().slice(0, -2)}`;
          break;
        }
        content += `\n${value}`;
      }
      if (next >= end) return false;
    } else {
      content = content.trimEnd().slice(0, -2);
    }
    if (silent) return true;
    const token = state.push("math_block", "div", 0);
    token.block = true;
    token.content = content;
    token.map = [start, next + 1];
    state.line = next + 1;
    return true;
  });
  md.renderer.rules.math_block = (tokens, index) =>
    `<div class="math-block">\\[${escapeHtml(tokens[index]!.content)}\\]</div>\n`;

  md.block.ruler.before("paragraph", "math_brackets", (state, start, _end, silent) => {
    const first = state.bMarks[start]! + state.tShift[start]!;
    const line = state.src.slice(first, state.eMarks[start]!);
    if (!line.startsWith("\\[") || !line.trimEnd().endsWith("\\]")) return false;
    if (silent) return true;
    const token = state.push("math_block", "div", 0);
    token.block = true;
    token.content = line.slice(2, line.trimEnd().length - 2);
    token.map = [start, start + 1];
    state.line = start + 1;
    return true;
  });
}

export function createMarkdownIt(options: MarkdownOptions = {}): MarkdownIt {
  const markdownOptions: Options = {
    html: false,
    breaks: options.breaks ?? false,
    linkify: options.linkify ?? true,
    typographer: options.typographer ?? true,
    highlight(code, language) {
      if (language === "mermaid") {
        return `<pre class="mermaid"><code class="language-mermaid">${escapeHtml(code)}</code></pre>`;
      }
      if (language && hljs.getLanguage(language)) {
        return `<pre><code class="hljs language-${escapeHtml(language)}">${hljs.highlight(code, { language }).value}</code></pre>`;
      }
      return `<pre><code class="hljs">${hljs.highlightAuto(code).value}</code></pre>`;
    }
  };
  return new MarkdownIt(markdownOptions).use(mathPlugin);
}

export function renderMarkdown(markdown: string, options?: MarkdownOptions): string {
  return createMarkdownIt(options).render(markdown);
}
