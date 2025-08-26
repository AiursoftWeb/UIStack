using Aiursoft.UiStack.Views.Shared.Components.MegaMenu;

namespace Aiursoft.UiStack.Views.Shared.Components.MessagesDropdown;

public class MessagesDropdownViewModel
{
    public Message[] Messages { get; set; } = [];

    public required Link ViewAllLink { get; set; }
}

public class Message
{
    public required string SenderAvatarUrl { get; set; }

    public required string SenderName { get; set; }

    public required string LatestMessagePreview { get; set; }

    public required string ClickableLink { get; set; }

    public required DateTime LatestMessageTime { get; set; }
}
