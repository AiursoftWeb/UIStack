using Aiursoft.Scanner;
using Aiursoft.WebTools.Abstractions.Models;

namespace Aiursoft.UiStack.Demo;

public class Startup : IWebStartup
{
    public void ConfigureServices(IConfiguration configuration, IWebHostEnvironment environment, IServiceCollection services)
    {
        services
            .AddControllersWithViews()
            .AddApplicationPart(typeof(Startup).Assembly)
            .AddAiursoftUiStack();
        services.AddLibraryDependencies();
    }

    public void Configure(WebApplication app)
    {
        app.UseStaticFiles();
        app.UseRouting();
        app.MapDefaultControllerRoute();
    }
}