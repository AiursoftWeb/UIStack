using Aiursoft.UiStack.Demo.Models.ViewModels.HomeViewModels;
using Aiursoft.UiStack.Demo.Services;
using Microsoft.AspNetCore.Mvc;

namespace Aiursoft.UiStack.Demo.Controllers;

public class HomeController(LayoutSettingsConfigure layout) : Controller
{
    public IActionResult Index()
    {
        var model = new IndexViewModel
        {
            PageTitle = "Index"
        };
        layout.ConfigureLayout(model);
        return this.UiStackView(model);
    }

    public IActionResult Analytics()
    {
        var model = new IndexViewModel
        {
            PageTitle = "Analytics"
        };
        layout.ConfigureLayout(model);
        return this.UiStackView(model);
    }

    public IActionResult Markdown()
    {
        var model = new MarkdownEditorViewModel
        {
            PageTitle = "Markdown Editor",
            InitialMarkdown = @"# Hello Markdown

This is a **live preview** editor.

## Features

- Paste images (Ctrl+V)
- Drag & drop images
- Code highlighting

```csharp
var answer = 42;
Console.WriteLine(answer);
```

```mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Do it]
    B -->|No| D[Skip]
```

| Column A | Column B |
|----------|----------|
| Value 1  | Value 2  |

Inline math: $E = mc^2$
"
        };
        layout.ConfigureLayout(model);
        return this.UiStackView(model, "~/Views/Home/Markdown.cshtml");
    }
}