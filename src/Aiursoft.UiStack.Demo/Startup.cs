using Aiursoft.UiStack.Demo.Services;
using Aiursoft.UiStack.Layout;
using Aiursoft.WebTools.Abstractions.Models;
using Microsoft.AspNetCore.Mvc.Razor;

namespace Aiursoft.UiStack.Demo;

public class Startup : IWebStartup
{
    public void ConfigureServices(IConfiguration configuration, IWebHostEnvironment environment,
        IServiceCollection services)
    {
        services
            .AddControllersWithViews()
            .AddApplicationPart(typeof(Startup).Assembly)
            .AddApplicationPart(typeof(UiStackLayoutViewModel).Assembly)
            .AddViewLocalization(LanguageViewLocationExpanderFormat.Suffix)
            .AddDataAnnotationsLocalization();

        services.AddScoped<LayoutSettingsConfigure>();
        services.AddScoped<FooterMenuProvider>();
        services.AddScoped<MegaMenuProvider>();
        services.AddScoped<SearchFormProvider>();
        services.AddScoped<MessagesDropdownProvider>();
        services.AddScoped<NotificationsDropdownProvider>();
        services.AddScoped<LanguagesDropdownProvider>();
        services.AddScoped<UserDropdownProvider>();
        services.AddScoped<SidebarProvider>();
    }

    public void Configure(WebApplication app)
    {
        app.UseStaticFiles();
        app.UseRouting();
        app.MapDefaultControllerRoute();
    }
}
