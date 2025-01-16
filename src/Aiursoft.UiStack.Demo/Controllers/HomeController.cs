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
}