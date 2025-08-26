using Aiursoft.UiStack.Views.Shared.Components.MegaMenu;

namespace Aiursoft.UiStack.Views.Shared.Components.FooterMenu;

public class FooterMenuViewModel
{
    public required Link[] Links { get; set; } = [];

    public required Link AppBrand { get; set; }
}
