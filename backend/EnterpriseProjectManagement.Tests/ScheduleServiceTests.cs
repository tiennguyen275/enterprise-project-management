using EnterpriseProjectManagement.Application.Features.Schedule.DTOs;
using EnterpriseProjectManagement.Application.Features.Schedule.Services;
using EnterpriseProjectManagement.Domain.Entities;
using EnterpriseProjectManagement.Tests.TestDoubles;

namespace EnterpriseProjectManagement.Tests;

public class ScheduleServiceTests
{
    [Fact]
    public async Task GetProjectScheduleAsync_ComputesCriticalPathAndFloatCorrectly()
    {
        var project = new Project
        {
            Name = "ERP",
            Code = "ERP-01",
            StartDate = new DateTime(2026, 11, 1, 0, 0, 0, DateTimeKind.Utc)
        };

        var taskA = new ProjectTask { ProjectId = project.Id, TaskCode = "ERP-1", Title = "BRD", EstimatedHours = 16 };
        var taskB = new ProjectTask { ProjectId = project.Id, TaskCode = "ERP-2", Title = "API", EstimatedHours = 32 };
        var taskC = new ProjectTask { ProjectId = project.Id, TaskCode = "ERP-3", Title = "Docs", EstimatedHours = 8 };

        var depAB = new TaskDependency
        {
            ProjectId = project.Id,
            PredecessorTaskId = taskA.Id,
            SuccessorTaskId = taskB.Id,
            LagDays = 1
        };

        var service = new ScheduleService(
            new InMemoryRepository<TaskDependency>(new[] { depAB }),
            new InMemoryRepository<ProjectTask>(new[] { taskA, taskB, taskC }),
            new InMemoryRepository<Project>(new[] { project }),
            new InMemoryRepository<User>(),
            new FakeUnitOfWork());

        var result = await service.GetProjectScheduleAsync(project.Id);

        Assert.Equal(7, result.TotalProjectDays);
        Assert.Equal(2, result.CriticalTasksCount);

        var schedA = result.Schedule.Single(s => s.TaskId == taskA.Id);
        var schedB = result.Schedule.Single(s => s.TaskId == taskB.Id);
        var schedC = result.Schedule.Single(s => s.TaskId == taskC.Id);

        Assert.True(schedA.IsCritical);
        Assert.Equal(0, schedA.TotalFloatDays);
        Assert.True(schedB.IsCritical);
        Assert.Equal(3, schedB.EarlyStartDay);
        Assert.Equal(7, schedB.EarlyFinishDay);
        Assert.False(schedC.IsCritical);
        Assert.True(schedC.TotalFloatDays > 0);
    }

    [Fact]
    public async Task AddDependencyAsync_RejectsCircularDependency()
    {
        var project = new Project { Name = "Portal", Code = "PRT-01" };
        var taskA = new ProjectTask { ProjectId = project.Id, TaskCode = "PRT-1", Title = "Design", EstimatedHours = 8 };
        var taskB = new ProjectTask { ProjectId = project.Id, TaskCode = "PRT-2", Title = "Build", EstimatedHours = 8 };

        var existingDep = new TaskDependency
        {
            ProjectId = project.Id,
            PredecessorTaskId = taskA.Id,
            SuccessorTaskId = taskB.Id,
            LagDays = 0
        };

        var service = new ScheduleService(
            new InMemoryRepository<TaskDependency>(new[] { existingDep }),
            new InMemoryRepository<ProjectTask>(new[] { taskA, taskB }),
            new InMemoryRepository<Project>(new[] { project }),
            new InMemoryRepository<User>(),
            new FakeUnitOfWork());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.AddDependencyAsync(project.Id, new CreateTaskDependencyRequestDto(taskB.Id, taskA.Id, 0)));
    }
}
