using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aiursoft.UiStack.Navigation;

public class NavigationState<T>
{
    public readonly IReadOnlyList<NavGroupDefinition> NavMap;

    public NavigationState()
    {
        var navGroups = new Dictionary<string, NavGroupDefinition>();

        var controllers = typeof(T).Assembly.GetTypes()
            .Where(type => typeof(Controller).IsAssignableFrom(type));

        foreach (var controller in controllers)
        {
            var controllerName = controller.Name.Replace("Controller", "");
            var methods = controller.GetMethods(BindingFlags.Public | BindingFlags.Instance)
                .Where(m => m.IsDefined(typeof(RenderInNavBarAttribute), false));

            foreach (var method in methods)
            {
                var navAttr = method.GetCustomAttribute<RenderInNavBarAttribute>()!;
                var actionName = method.GetCustomAttribute<ActionNameAttribute>()?.Name ?? method.Name;

                var controllerAuthorizeAttr = controller.GetCustomAttribute<AuthorizeAttribute>();
                var methodAuthorizeAttr = method.GetCustomAttribute<AuthorizeAttribute>();
                var methodAllowAnonymous = method.GetCustomAttribute<AllowAnonymousAttribute>();

                string? requiredPolicy = null;
                if (methodAllowAnonymous != null)
                {
                    requiredPolicy = null;
                }
                else if (methodAuthorizeAttr != null)
                {
                    requiredPolicy = methodAuthorizeAttr.Policy;
                }
                else if (controllerAuthorizeAttr != null)
                {
                    requiredPolicy = controllerAuthorizeAttr.Policy;
                }

                if (!navGroups.TryGetValue(navAttr.NavGroupName, out var group))
                {
                    group = new NavGroupDefinition(
                        navAttr.NavGroupName,
                        navAttr.NavGroupOrder,
                        new List<NavItemDefinition>());
                    navGroups[navAttr.NavGroupName] = group;
                }

                var item = group.Items.FirstOrDefault(i => i.Text == navAttr.CascadedLinksGroupName);
                if (item == null)
                {
                    item = new NavItemDefinition(
                        navAttr.CascadedLinksGroupName.ToLower().Replace(" ", "-"),
                        navAttr.CascadedLinksGroupName,
                        navAttr.CascadedLinksIcon,
                        navAttr.CascadedLinksOrder,
                        new List<NavLinkDefinition>());
                    group.Items.Add(item);
                }

                item.Links.Add(new NavLinkDefinition(
                    Href: $"/{controllerName}/{actionName}",
                    Text: navAttr.LinkText,
                    Order: navAttr.LinkOrder,
                    RequiredPolicy: requiredPolicy));
            }
        }

        foreach (var group in navGroups.Values)
        {
            foreach (var item in group.Items)
            {
                item.Links.Sort((a, b) => a.Order.CompareTo(b.Order));
            }
            group.Items.Sort((a, b) => a.Order.CompareTo(b.Order));
        }

        NavMap = navGroups.Values.OrderBy(g => g.Order).ToList();
    }
}
