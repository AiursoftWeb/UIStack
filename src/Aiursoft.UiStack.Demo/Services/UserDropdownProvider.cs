using Aiursoft.UiStack.Views.Shared.Components.UserDropdown;

namespace Aiursoft.UiStack.Demo.Services;

public class UserDropdownProvider
{
    public UserDropdownViewModel GetUserDropdown() => new()
    {
        UserName = "Anduin Xue",
        UserAvatarUrl = "/node_modules/@aiursoft/uistack/dist/img/avatars/avatar.jpg",
        IconLinkGroups =
        [
            new IconLinkGroup
            {
                Links =
                [
                    new IconLink { Icon = "user", Text = "Profile", Href = "#" },
                    new IconLink { Icon = "pie-chart", Text = "Analytics", Href = "#" }
                ]
            },
            new IconLinkGroup
            {
                Links =
                [
                    new IconLink { Text = "Settings", Href = "#", Icon = "settings" },
                    new IconLink { Text = "Help", Href = "#", Icon = "help-circle" },
                    new IconLink { Text = "Sign out", Href = "#", Icon = "log-out" }
                ]
            }
        ]
    };
}