using Aiursoft.UiStack.Views.Shared.Components.MegaMenu;
using Aiursoft.UiStack.Views.Shared.Components.NotificationsDropdown;

namespace Aiursoft.UiStack.Demo.Services;

public class NotificationsDropdownProvider
{
    public NotificationsDropdownViewModel GetNotificationsDropdown() => new()
    {
        Notifications =
        [
            new Notification
            {
                Icon = "alert-circle",
                IconClass = "text-danger",
                Title = "Server down",
                Message = "Server was down for 5 minutes.",
                TriggerTime = DateTime.Now - TimeSpan.FromMinutes(2)
            },
            new Notification
            {
                Icon = "bell",
                IconClass = "text-primary",
                Title = "New user",
                Message = "A new user registered.",
                TriggerTime = DateTime.Now - TimeSpan.FromMinutes(5)
            },
            new Notification
            {
                Icon = "home",
                IconClass = "text-warning",
                Title = "New login",
                Message = "Your account was logged in from a new device.",
                TriggerTime = DateTime.Now - TimeSpan.FromMinutes(15)
            },
            new Notification
            {
                Icon = "user-plus",
                IconClass = "text-success",
                Title = "New follower",
                Message = "You have a new follower.",
                TriggerTime = DateTime.Now - TimeSpan.FromMinutes(30)
            }
        ],
        ViewAllLink = new Link
        {
            Href = "#",
            Text = "View all notifications"
        }
    };
}