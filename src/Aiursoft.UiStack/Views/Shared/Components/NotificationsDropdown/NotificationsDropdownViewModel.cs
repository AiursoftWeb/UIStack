using Aiursoft.UiStack.Views.Shared.Components.MegaMenu;

namespace Aiursoft.UiStack.Views.Shared.Components.NotificationsDropdown;

public class NotificationsDropdownViewModel
{
    public IReadOnlyCollection<Notification> Notifications { get; set; } = [];

    public required Link ViewAllLink { get; set; }
}

public class Notification
{
    public required string Title { get; set; }
    public required string Message { get; set; }
    public required DateTime TriggerTime { get; set; }

    public required string Icon { get; set; } = "bell";
    public required string IconClass { get; set; } = "text-warning";
}
