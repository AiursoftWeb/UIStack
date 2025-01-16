using Aiursoft.UiStack.Views.Shared.Components.FooterMenu;
using Aiursoft.UiStack.Views.Shared.Components.MegaMenu;

namespace Aiursoft.UiStack.Demo.Services;

public class FooterMenuProvider
{
    public FooterMenuViewModel GetFooterMenu() => new()
    {
        AppBrand = new Link { Text = "UiStack.Demo", Href = "/" },
        Links =
        [
            new Link { Text = "Home", Href = "/" },
            new Link { Text = "Privacy", Href = "/" },
            new Link { Text = "About", Href = "/" },
            new Link { Text = "Badge", Href = "/" }
        ]
    };
}