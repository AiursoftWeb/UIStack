namespace Aiursoft.UiStack.Views.Shared.Components.UserDropdown;

public class UserDropdownViewModel
{
    public required string UserName { get; set; }

    public required string UserAvatarUrl { get; set; }

    public required IconLinkGroup[] IconLinkGroups { get; set; }
}

public class IconLinkGroup
{
    public required IconLink[] Links { get; set; } = [];
}

public class IconLink
{
    public required string Icon { get; set; }

    public required string Text { get; set; }

    public required string Href { get; set; }
}
