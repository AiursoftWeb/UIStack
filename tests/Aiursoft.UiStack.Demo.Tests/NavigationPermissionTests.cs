using Aiursoft.UiStack.Navigation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aiursoft.UiStack.Demo.Tests;

[TestClass]
public class NavigationPermissionTests
{
    [Authorize(Policy = "ControllerPolicy")]
    public class ProtectedController : Controller
    {
        [RenderInNavBar(
            NavGroupName = "TestGroup",
            NavGroupOrder = 1,
            CascadedLinksGroupName = "Test",
            CascadedLinksIcon = "icon",
            CascadedLinksOrder = 1,
            LinkText = "ProtectedAction",
            LinkOrder = 1)]
        public IActionResult ProtectedAction()
        {
            return Ok();
        }

        [AllowAnonymous]
        [RenderInNavBar(
            NavGroupName = "TestGroup",
            NavGroupOrder = 1,
            CascadedLinksGroupName = "Test",
            CascadedLinksIcon = "icon",
            CascadedLinksOrder = 1,
            LinkText = "AnonymousAction",
            LinkOrder = 2)]
        public IActionResult AnonymousAction()
        {
            return Ok();
        }

        [Authorize(Policy = "ActionPolicy")]
        [RenderInNavBar(
            NavGroupName = "TestGroup",
            NavGroupOrder = 1,
            CascadedLinksGroupName = "Test",
            CascadedLinksIcon = "icon",
            CascadedLinksOrder = 1,
            LinkText = "ActionWithPolicy",
            LinkOrder = 3)]
        public IActionResult ActionWithPolicy()
        {
            return Ok();
        }
    }

    [TestMethod]
    public void TestNavigationPermissions()
    {
        var navState = new NavigationState<ProtectedController>();
        var group = navState.NavMap.First(g => g.Name == "TestGroup");
        var item = group.Items.First(i => i.Text == "Test");

        // 1. Action inheriting Controller Policy
        var protectedLink = item.Links.First(l => l.Text == "ProtectedAction");
        Assert.AreEqual("ControllerPolicy", protectedLink.RequiredPolicy);

        // 2. Action explicitly AllowAnonymous (should have no policy)
        var anonymousLink = item.Links.First(l => l.Text == "AnonymousAction");
        Assert.IsNull(anonymousLink.RequiredPolicy);

        // 3. Action with own Policy overrides/combines? 
        // Typically in ASP.NET Core, both apply. But for navigation hiding, 
        // usually we check if user satisfies *all* or *any*.
        // The current implementation of NavLinkDefinition only supports one string?
        // Let's check the code. It captures `authorizeAttr?.Policy`.
        // If we want to support hierarchal, update logic to pick valid one.
        // If method has policy, it usually is stricter or specific.
        // For this task, if method has Check, use Method's. 
        // If method doesn't, use Controller's.
        
        var specificLink = item.Links.First(l => l.Text == "ActionWithPolicy");
        // If our logic is "Method Policy takes precedence if exists", then "ActionPolicy".
        // If logic is "Aggregate", that might be complex for a single string field.
        // The user request says: "Action doesn't need permission, but controller does, so it shows up incorrectly."
        // So the main fix is: Fallback to Controller policy if Method policy is missing.
        
        Assert.AreEqual("ActionPolicy", specificLink.RequiredPolicy);
    }
}
