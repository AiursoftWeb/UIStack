export interface Highlighter {
  highlightElement(element: HTMLElement): void;
}

export interface MermaidApi {
  initialize(options: { startOnLoad: boolean; securityLevel: "strict"; theme?: string }): void;
  run(options: { nodes: HTMLElement[] }): Promise<void>;
}

export interface MathJaxApi {
  startup?: { promise?: Promise<unknown> };
  typesetPromise(elements?: HTMLElement[]): Promise<unknown>;
}

export interface ReaderDependencies {
  hljs?: Highlighter;
  mermaid?: MermaidApi;
  MathJax?: MathJaxApi;
}

export interface RenderReaderOptions extends ReaderDependencies {
  container: string | HTMLElement | Iterable<HTMLElement>;
  mermaidTheme?: string;
  decorateTables?: boolean;
  tableClassNames?: string[];
  tableWrapperClassName?: string;
  openLinksInNewTab?: boolean;
}

type MarkdownGlobals = typeof globalThis & ReaderDependencies;

function containersOf(target: RenderReaderOptions["container"]): HTMLElement[] {
  if (typeof target === "string") return Array.from(document.querySelectorAll<HTMLElement>(target));
  if (target instanceof HTMLElement) return [target];
  return Array.from(target);
}

function decorateMarkdown(containers: HTMLElement[], options: RenderReaderOptions): void {
  if (options.decorateTables !== false) {
    const tableClasses = options.tableClassNames ?? ["table", "table-striped", "table-bordered"];
    const wrapperClass = options.tableWrapperClassName ?? "table-responsive";
    for (const container of containers) {
      for (const table of container.querySelectorAll<HTMLTableElement>("table")) {
        table.classList.add(...tableClasses);
        if (wrapperClass && !table.parentElement?.classList.contains(wrapperClass)) {
          const wrapper = document.createElement("div");
          wrapper.className = wrapperClass;
          table.parentNode?.insertBefore(wrapper, table);
          wrapper.appendChild(table);
        }
      }
    }
  }

  if (options.openLinksInNewTab !== false) {
    for (const container of containers) {
      for (const link of container.querySelectorAll<HTMLAnchorElement>("a[href]")) {
        link.target = "_blank";
        const rel = new Set(link.rel.split(/\s+/).filter(Boolean));
        rel.add("noopener");
        rel.add("noreferrer");
        link.rel = Array.from(rel).join(" ");
      }
    }
  }
}

export async function enhanceMarkdown(options: RenderReaderOptions): Promise<void> {
  const globals = globalThis as MarkdownGlobals;
  const containers = containersOf(options.container);
  const highlighter = options.hljs ?? globals.hljs;
  const mermaid = options.mermaid ?? globals.mermaid;
  const mathJax = options.MathJax ?? globals.MathJax;
  decorateMarkdown(containers, options);

  if (highlighter) {
    for (const container of containers) {
      for (const code of container.querySelectorAll<HTMLElement>("pre code:not(.language-mermaid)")) {
        if (!code.dataset.highlighted) highlighter.highlightElement(code);
      }
    }
  }

  if (mermaid) {
    const nodes: HTMLElement[] = [];
    for (const container of containers) {
      for (const code of container.querySelectorAll<HTMLElement>("pre code.language-mermaid")) {
        const pre = code.closest("pre");
        if (!pre || pre.dataset.mermaidProcessed) continue;
        const replacement = document.createElement("div");
        replacement.className = "mermaid";
        replacement.textContent = code.textContent;
        replacement.dataset.mermaidProcessed = "true";
        pre.replaceWith(replacement);
        nodes.push(replacement);
      }
      for (const node of container.querySelectorAll<HTMLElement>(".mermaid:not([data-mermaid-processed])")) {
        node.dataset.mermaidProcessed = "true";
        nodes.push(node);
      }
    }
    if (nodes.length > 0) {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: options.mermaidTheme
      });
      await mermaid.run({ nodes });
    }
  }

  if (mathJax) {
    await mathJax.startup?.promise;
    await mathJax.typesetPromise(containers);
  }
}

export async function initializeMarkdownReader(options: RenderReaderOptions): Promise<void> {
  await enhanceMarkdown(options);
}

export async function printMarkdown(options: RenderReaderOptions): Promise<void> {
  await enhanceMarkdown(options);
  window.print();
}
