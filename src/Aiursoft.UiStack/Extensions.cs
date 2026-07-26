using Aiursoft.UiStack.Layout;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.FileProviders;

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

    /// <summary>
    /// Serve UIStack static assets (CSS, JS, fonts, images) from embedded resources.
    /// Must be called before UseStaticFiles() in Startup.Configure.
    /// </summary>
    public static IApplicationBuilder UseUIStack(this IApplicationBuilder app)
    {
        var assembly = typeof(Extensions).Assembly;
        var embeddedProvider = new EmbeddedFileProvider(assembly, $"{assembly.GetName().Name}.Resources.dist");

        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = embeddedProvider,
            RequestPath = "/UIStack/dist"
        });

        return app;
    }
}
