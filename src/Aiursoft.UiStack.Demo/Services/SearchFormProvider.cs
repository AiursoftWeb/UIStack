using Aiursoft.UiStack.Views.Shared.Components.SearchForm;

namespace Aiursoft.UiStack.Demo.Services;

public class SearchFormProvider
{
    public SearchFormViewModel GetSearchForm() => new()
    {
        Placeholder = "Search...",
        SearchParam = "q",
        SearchUrl = "/search"
    };
}