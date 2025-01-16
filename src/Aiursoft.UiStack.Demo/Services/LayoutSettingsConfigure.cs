using Aiursoft.UiStack.Layout;
using Aiursoft.UiStack.Views.Shared.Components.Navbar;
using Microsoft.AspNetCore.Http.Extensions;

namespace Aiursoft.UiStack.Demo.Services;

public class LayoutSettingsConfigure(
    FooterMenuProvider footerMenuProvider,
    MegaMenuProvider megaMenuProvider,
    SearchFormProvider searchFormProvider,
    MessagesDropdownProvider messagesDropdownProvider,
    NotificationsDropdownProvider notificationsDropdownProvider,
    LanguagesDropdownProvider languagesDropdownProvider,
    UserDropdownProvider userDropdownProvider,
    SidebarProvider sidebarProvider)
{
    public void ConfigureLayout(UiStackLayoutViewModel input, HttpContext context)
    {
        if (string.IsNullOrWhiteSpace(input.PageTitle))
        {
            input.PageTitle = "Unknown";
        }

        if (string.IsNullOrWhiteSpace(input.AppName))
        {
            input.AppName = "The demo project of UiStack";
        }

        if (string.IsNullOrWhiteSpace(input.Description))
        {
            input.Description = "This is a demo project of UiStack. It shows how to use UiStack to build a website.";
        }

        // if (string.IsNullOrWhiteSpace(input.CanonicalUrl))
        // {
        //     var displayUrl = context.Request.GetDisplayUrl();
        //     var index = displayUrl.IndexOf('?');
        //     if (index != -1)
        //     {
        //         displayUrl = displayUrl.Substring(0, index);
        //     }
        //     input.CanonicalUrl = displayUrl;
        // }
        
        input.Theme = UiTheme.Dark;
        input.SidebarTheme = UiSidebarTheme.Dark;
        input.Layout = UiLayout.Fluid;

        input.Navbar = new NavbarViewModel
        {
            SearchForm = searchFormProvider.GetSearchForm(),
            MegaMenu = megaMenuProvider.GetMegaMenu(),
            MessagesDropdown = messagesDropdownProvider.GetMessagesDropdown(),
            NotificationsDropdown = notificationsDropdownProvider.GetNotificationsDropdown(),
            LanguagesDropdown = languagesDropdownProvider.GetLanguagesDropdown(),
            UserDropdown = userDropdownProvider.GetUserDropdown()
        };

        input.Sidebar = sidebarProvider.GetSidebar();
        input.FooterMenu = footerMenuProvider.GetFooterMenu();
    }
}