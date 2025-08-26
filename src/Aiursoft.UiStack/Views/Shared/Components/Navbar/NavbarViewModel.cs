using Aiursoft.UiStack.Views.Shared.Components.LanguagesDropdown;
using Aiursoft.UiStack.Views.Shared.Components.MegaMenu;
using Aiursoft.UiStack.Views.Shared.Components.MessagesDropdown;
using Aiursoft.UiStack.Views.Shared.Components.NotificationsDropdown;
using Aiursoft.UiStack.Views.Shared.Components.SearchForm;
using Aiursoft.UiStack.Views.Shared.Components.UserDropdown;

namespace Aiursoft.UiStack.Views.Shared.Components.Navbar;

public class NavbarViewModel
{
    public SearchFormViewModel? SearchForm { get; set; }
    public MegaMenuViewModel? MegaMenu { get; set; }

    public MessagesDropdownViewModel? MessagesDropdown { get; set; }

    public NotificationsDropdownViewModel? NotificationsDropdown { get; set; }

    public LanguagesDropdownViewModel? LanguagesDropdown { get; set; }

    public UserDropdownViewModel? UserDropdown { get; set; }
}
