namespace Aiursoft.UiStack.Navigation;

// ReSharper disable NotAccessedPositionalProperty.Global
public record NavItemDefinition(string UniqueId, string Text, string Icon, int Order, List<NavLinkDefinition> Links);
// ReSharper restore NotAccessedPositionalProperty.Global
