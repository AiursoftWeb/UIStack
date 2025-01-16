using Aiursoft.UiStack.Views.Shared.Components.LanguagesDropdown;

namespace Aiursoft.UiStack.Demo.Services;

public class LanguagesDropdownProvider
{
    public LanguagesDropdownViewModel GetLanguagesDropdown() => new()
    {
        SelectedLanguage = new LanguageSelection
        {
            FlagUrl = "/node_modules/@aiursoft/uistack/dist/img/flags/us.png",
            Link = "#",
            Name = "English - United States"
        },
        Languages =
        [
            new LanguageSelection
            {
                FlagUrl = "/node_modules/@aiursoft/uistack/dist/img/flags/us.png",
                Link = "#",
                Name = "English - United States"
            },
            new LanguageSelection
            {
                FlagUrl = "/node_modules/@aiursoft/uistack/dist/img/flags/cn.png",
                Link = "#",
                Name = "中文 - 简体"
            }
        ]
    };
}