using Aiursoft.UiStack.Views.Shared.Components.SideAdvertisement;
using Aiursoft.UiStack.Views.Shared.Components.Sidebar;
using Aiursoft.UiStack.Views.Shared.Components.SideLogo;
using Aiursoft.UiStack.Views.Shared.Components.SideMenu;

namespace Aiursoft.UiStack.Demo.Services;

public class SidebarProvider
{
    public SidebarViewModel GetSidebar() => new()
    {
        SideLogo = new SideLogoViewModel
        {
            AppName = "Aiursoft UI Stack",
            LogoUrl = "https://docs.anduinos.com/Assets/logo.svg",
            Href = "/"
        },
        SideMenu = new SideMenuViewModel
        {
            Groups =
            [
                new NavGroup
                {
                    Name = "Navigation",
                    Items =
                    [
                        new CascadedSideBarItem
                        {
                            UniqueId = "dashboards",
                            Text = "Dashboards",
                            IsActive = true,
                            LucideIcon = "sliders",
                            Decoration = new Decoration
                            {
                                Text = "5",
                                ColorClass = "primary"
                            },
                            Links =
                            [
                                new CascadedLink
                                {
                                    Href = "/", 
                                    Text = "Default",
                                    IsActive = true
                                },
                                new CascadedLink { Href = "/home/analytics", Text = "Analytics" },
                                new CascadedLink { Href = "#", Text = "SaaS" },
                                new CascadedLink { Href = "#", Text = "Social" },
                                new CascadedLink { Href = "#", Text = "Crypto" }
                            ]
                        }
                    ]
                },
                new NavGroup
                {
                    Name = "Apps",
                    Items =
                    [
                        new CascadedSideBarItem
                        {
                            UniqueId = "ecommerce",
                            Text = "E-Commerce",
                            IsActive = false,
                            LucideIcon = "shopping-bag",
                            Links =
                            [
                                new CascadedLink
                                {
                                    Href = "#",
                                    Text = "Products",
                                    Decoration = new Decoration
                                    {
                                        Text = "New",
                                        ColorClass = "primary"
                                    }
                                },
                                new CascadedLink { Href = "#", Text = "Product Details" },
                                new CascadedLink { Href = "#", Text = "Orders" },
                                new CascadedLink { Href = "#", Text = "Customers" },
                                new CascadedLink { Href = "#", Text = "Invoice" },
                                new CascadedLink { Href = "#", Text = "Pricing" }
                            ]
                        },
                        new CascadedSideBarItem
                        {
                            UniqueId = "projects",
                            Text = "Projects",
                            LucideIcon = "layout",
                            Links =
                            [
                                new CascadedLink { Href = "#", Text = "Overview" },
                                new CascadedLink { Href = "#", Text = "Details" }
                            ]
                        },
                        new LinkSideBarItem
                        {
                            Text = "Chat",
                            LucideIcon = "list",
                            Href = "#"
                        }
                    ]
                }
            ]
        },
        SideAdvertisement = new SideAdvertisementViewModel
        {
            Title = "Download Native App",
            Description = "Get the best experience with our app.",
            Href = "#",
            ButtonText = "Download"
        }
    };
}