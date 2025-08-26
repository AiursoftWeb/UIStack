namespace Aiursoft.UiStack.Views.Shared.Components.SearchForm;

public class SearchFormViewModel
{
    public required string SearchUrl { get; set; }

    public required string Placeholder { get; set; } = "Search...";

    public required string SearchParam { get; set; } = "q";
}
