using Aiursoft.UiStack.Layout;
using Microsoft.AspNetCore.Mvc;

namespace Aiursoft.UiStack;

public static class Extensions
{
    public static ViewResult UiStackView(this Controller controller, UiStackLayoutViewModel model)
    {
        return controller.View(model: model);
    }

    public static ViewResult UiStackView(this Controller controller, UiStackLayoutViewModel model, string viewName)
    {
        return controller.View(viewName, model);
    }
}
