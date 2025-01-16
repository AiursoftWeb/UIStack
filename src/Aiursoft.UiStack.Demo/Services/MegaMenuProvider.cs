using Aiursoft.UiStack.Views.Shared.Components.MegaMenu;

namespace Aiursoft.UiStack.Demo.Services;

public class MegaMenuProvider
{
    public MegaMenuViewModel GetMegaMenu() => new()
    {
        MenuName = "My Mega Menu",
        DropDowns =
        [
            new DropDown
            {
                Header = "Home",
                Links =
                [
                    new Link { Text = "Index", Href = "/" },
                    new Link { Text = "Privacy", Href = "/" },
                    new Link { Text = "About", Href = "/" },
                    new Link { Text = "Badge", Href = "/" }
                ]
            },
            new DropDown
            {
                Header = "Account",
                Links =
                [
                    new Link { Text = "Sign in", Href = "/" },
                    new Link { Text = "Sign up", Href = "/" }
                ]
            }
        ]
    };
}