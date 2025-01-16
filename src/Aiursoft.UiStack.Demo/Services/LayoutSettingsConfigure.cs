using Aiursoft.UiStack.Layout;
using Aiursoft.UiStack.Views.Shared.Components.Navbar;

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
    public void ConfigureLayout(UiStackLayoutViewModel input)
    {
        if (string.IsNullOrWhiteSpace(input.PageTitle))
        {
            input.PageTitle = "Unknown";
        }

        if (string.IsNullOrWhiteSpace(input.AppName))
        {
            input.AppName = "The demo project of UiStack";
        }

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