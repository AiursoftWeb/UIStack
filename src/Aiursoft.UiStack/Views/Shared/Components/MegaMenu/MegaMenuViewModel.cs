namespace Aiursoft.UiStack.Views.Shared.Components.MegaMenu;

public class MegaMenuViewModel
{
    public required string MenuName { get; set; }
    public required DropDown[] DropDowns { get; set; } = [];
}

public class DropDown
{
    public required string Header { get; set; }
    public required Link[] Links { get; set; } = [];
}

public class Link
{
    public required string Text { get; set; }
    public required string Href { get; set; }
}
