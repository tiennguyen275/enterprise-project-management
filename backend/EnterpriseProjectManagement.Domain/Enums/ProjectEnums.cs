namespace EnterpriseProjectManagement.Domain.Enums;

public enum ProjectStatus
{
    Planning = 1,
    Active = 2,
    OnHold = 3,
    Completed = 4,
    Archived = 5
}

public enum ProjectRole
{
    Owner = 1,
    ProjectManager = 2,
    Member = 3,
    Viewer = 4
}

public enum ProjectHealthRating
{
    OnTrack = 1,
    AtRisk = 2,
    Delayed = 3
}
