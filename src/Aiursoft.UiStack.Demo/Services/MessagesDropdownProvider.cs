using Aiursoft.UiStack.Views.Shared.Components.MegaMenu;
using Aiursoft.UiStack.Views.Shared.Components.MessagesDropdown;

namespace Aiursoft.UiStack.Demo.Services;

public class MessagesDropdownProvider
{
    public MessagesDropdownViewModel GetMessagesDropdown() => new()
    {
        Messages =
        [
            new Message
            {
                SenderAvatarUrl = "/node_modules/@aiursoft/uistack/dist/img/avatars/avatar-2.jpg",
                SenderName = "Anduin Xue",
                LatestMessagePreview = "Hello, world!",
                ClickableLink = "#",
                LatestMessageTime = DateTime.Now - TimeSpan.FromMinutes(5)
            }
        ],
        ViewAllLink = new Link
        {
            Href = "#",
            Text = "View all messages"
        }
    };
}