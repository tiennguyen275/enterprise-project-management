using EnterpriseProjectManagement.Application.Features.Activities.Services;
using EnterpriseProjectManagement.Application.Features.Projects.Services;
using EnterpriseProjectManagement.Application.Features.Search.Services;
using EnterpriseProjectManagement.Application.Features.Tasks.Services;
using EnterpriseProjectManagement.Application.Features.Users.Services;
using EnterpriseProjectManagement.Domain.Entities;
using EnterpriseProjectManagement.Domain.Enums;
using EnterpriseProjectManagement.Tests.TestDoubles;

namespace EnterpriseProjectManagement.Tests;

public class SecurityAndRbacTests
{
    [Fact]
    public async Task UserService_BlocksLockedAdminAndInvalidEnumRole()
    {
        var lockedAdmin = new User { Email = "locked@epms.vn", FullName = "Locked Admin", SystemRole = SystemRole.Admin, IsActive = false };
        var activeAdmin = new User { Email = "admin@epms.vn", FullName = "Active Admin", SystemRole = SystemRole.Admin, IsActive = true };
        var employee = new User { Email = "emp@epms.vn", FullName = "Employee", SystemRole = SystemRole.User, IsActive = true };

        var service = new UserService(
            new InMemoryRepository<User>(new[] { lockedAdmin, activeAdmin, employee }),
            new InMemoryRepository<ProjectMember>(),
            new InMemoryRepository<ProjectTask>(),
            new FakeUnitOfWork());

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.ToggleUserActiveAsync(lockedAdmin.Id, lockedAdmin.Id, true));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpdateUserRoleAsync(activeAdmin.Id, employee.Id, (SystemRole)99));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpdateUserRoleAsync(activeAdmin.Id, activeAdmin.Id, SystemRole.User));

        var promoted = await service.UpdateUserRoleAsync(activeAdmin.Id, employee.Id, SystemRole.Admin);
        Assert.Equal("Admin", promoted.SystemRole);
    }

    [Fact]
    public async Task ActivityLogService_BlocksNonMemberEmployee_AllowsAdminAndMember()
    {
        var admin = new User { Email = "admin@epms.vn", FullName = "Admin", SystemRole = SystemRole.Admin, IsActive = true };
        var member = new User { Email = "member@epms.vn", FullName = "Member", SystemRole = SystemRole.User, IsActive = true };
        var outsider = new User { Email = "outsider@epms.vn", FullName = "Outsider", SystemRole = SystemRole.User, IsActive = true };
        var projectId = Guid.NewGuid();

        var membership = new ProjectMember { ProjectId = projectId, UserId = member.Id, Role = ProjectRole.Member };
        var log = new ProjectActivityLog { ProjectId = projectId, ActorId = member.Id, ActorName = member.FullName, Action = "task_created", Description = "Created task" };

        var service = new ActivityLogService(
            new InMemoryRepository<ProjectActivityLog>(new[] { log }),
            new InMemoryRepository<ProjectMember>(new[] { membership }),
            new InMemoryRepository<ProjectTask>(),
            new InMemoryRepository<User>(new[] { admin, member, outsider }),
            new FakeUnitOfWork());

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.GetProjectActivitiesAsync(projectId, outsider.Id));

        var memberLogs = await service.GetProjectActivitiesAsync(projectId, member.Id);
        var adminLogs = await service.GetProjectActivitiesAsync(projectId, admin.Id);

        Assert.Single(memberLogs);
        Assert.Single(adminLogs);
    }

    [Fact]
    public async Task GlobalSearchService_SupportsVietnameseAccentInsensitiveAndEnforcesRbac()
    {
        var admin = new User { Email = "admin@epms.vn", FullName = "Nguyễn Tiến", SystemRole = SystemRole.Admin, IsActive = true };
        var emp = new User { Email = "bao@epms.vn", FullName = "Đỗ Gia Bảo", SystemRole = SystemRole.User, IsActive = true };
        var lockedUser = new User { Email = "locked@epms.vn", FullName = "Locked", SystemRole = SystemRole.User, IsActive = false };

        var proj1 = new Project { Name = "Nâng cấp hệ thống điện máy lạnh", Code = "HVAC-01" };
        var proj2 = new Project { Name = "Hệ thống ERP Tài chính", Code = "ERP-01" };
        var member1 = new ProjectMember { ProjectId = proj1.Id, UserId = emp.Id, Role = ProjectRole.Member };

        var task1 = new ProjectTask { ProjectId = proj1.Id, TaskCode = "HVAC-1", Title = "Kiểm tra máy nén", AssigneeId = emp.Id };
        var task2 = new ProjectTask { ProjectId = proj2.Id, TaskCode = "ERP-1", Title = "Thiết kế sổ cái", AssigneeId = admin.Id };

        var service = new GlobalSearchService(
            new InMemoryRepository<User>(new[] { admin, emp, lockedUser }),
            new InMemoryRepository<Project>(new[] { proj1, proj2 }),
            new InMemoryRepository<ProjectMember>(new[] { member1 }),
            new InMemoryRepository<ProjectTask>(new[] { task1, task2 }));

        var empHit = await service.SearchAsync(emp.Id, "dien may lanh");
        Assert.Single(empHit.Projects);
        Assert.Equal("HVAC-01", empHit.Projects[0].Code);

        var empHidden = await service.SearchAsync(emp.Id, "tai chinh");
        Assert.Empty(empHidden.Projects);

        var adminHit = await service.SearchAsync(admin.Id, "tai chinh");
        Assert.Single(adminHit.Projects);
        Assert.Equal("ERP-01", adminHit.Projects[0].Code);

        var userHit = await service.SearchAsync(admin.Id, "gia bao");
        Assert.Single(userHit.Users);
        Assert.Equal("Đỗ Gia Bảo", userHit.Users[0].FullName);

        var lockedHit = await service.SearchAsync(lockedUser.Id, "dien may lanh");
        Assert.Empty(lockedHit.Projects);
        Assert.Empty(lockedHit.Tasks);
        Assert.Empty(lockedHit.Users);
    }

    [Fact]
    public async Task ProjectService_RemoveMember_BlocksNonManagerAndProtectsOwner()
    {
        var owner = new User { Email = "owner@epms.vn", FullName = "Owner", SystemRole = SystemRole.User, IsActive = true };
        var member = new User { Email = "member@epms.vn", FullName = "Member", SystemRole = SystemRole.User, IsActive = true };
        var project = new Project { Name = "Demo", Code = "DM-01" };
        var mOwner = new ProjectMember { ProjectId = project.Id, UserId = owner.Id, Role = ProjectRole.Owner };
        var mMember = new ProjectMember { ProjectId = project.Id, UserId = member.Id, Role = ProjectRole.Member };

        var service = new ProjectService(
            new InMemoryRepository<Project>(new[] { project }),
            new InMemoryRepository<ProjectMember>(new[] { mOwner, mMember }),
            new InMemoryRepository<User>(new[] { owner, member }),
            new InMemoryRepository<ProjectTask>(),
            new FakeUnitOfWork());

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.RemoveMemberAsync(project.Id, owner.Id, member.Id));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.RemoveMemberAsync(project.Id, owner.Id, owner.Id));

        await service.RemoveMemberAsync(project.Id, member.Id, owner.Id);
        Assert.False(await service.CanUserAccessProjectAsync(project.Id, member.Id));
    }

    [Fact]
    public void TaskAttachmentService_ValidatesAllowedFileExtensions()
    {
        Assert.True(TaskAttachmentService.IsExtensionAllowed(".pdf"));
        Assert.True(TaskAttachmentService.IsExtensionAllowed(".XLSX"));
        Assert.False(TaskAttachmentService.IsExtensionAllowed(".exe"));
        Assert.False(TaskAttachmentService.IsExtensionAllowed(".html"));
    }

    [Fact]
    public async Task ActivityLogService_GetTaskActivities_FiltersByTaskCodeAndEnforcesRbac()
    {
        var member = new User { Email = "m@epms.vn", FullName = "Member", SystemRole = SystemRole.User, IsActive = true };
        var outsider = new User { Email = "o@epms.vn", FullName = "Outsider", SystemRole = SystemRole.User, IsActive = true };
        var projectId = Guid.NewGuid();
        var taskA = new ProjectTask { ProjectId = projectId, TaskCode = "PRJ-1", Title = "Task A" };
        var taskB = new ProjectTask { ProjectId = projectId, TaskCode = "PRJ-2", Title = "Task B" };

        var logA = new ProjectActivityLog { ProjectId = projectId, ActorId = member.Id, ActorName = member.FullName, Action = "task_updated", TargetCode = "PRJ-1", Description = "Đổi trạng thái A" };
        var logB = new ProjectActivityLog { ProjectId = projectId, ActorId = member.Id, ActorName = member.FullName, Action = "task_updated", TargetCode = "PRJ-2", Description = "Đổi trạng thái B" };

        var service = new ActivityLogService(
            new InMemoryRepository<ProjectActivityLog>(new[] { logA, logB }),
            new InMemoryRepository<ProjectMember>(new[] { new ProjectMember { ProjectId = projectId, UserId = member.Id, Role = ProjectRole.Member } }),
            new InMemoryRepository<ProjectTask>(new[] { taskA, taskB }),
            new InMemoryRepository<User>(new[] { member, outsider }),
            new FakeUnitOfWork());

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.GetTaskActivitiesAsync(taskA.Id, outsider.Id));

        var taskALogs = await service.GetTaskActivitiesAsync(taskA.Id, member.Id);
        Assert.Single(taskALogs);
        Assert.Equal("PRJ-1", taskALogs[0].TargetCode);
        Assert.Equal("Đổi trạng thái A", taskALogs[0].Description);
    }
}
