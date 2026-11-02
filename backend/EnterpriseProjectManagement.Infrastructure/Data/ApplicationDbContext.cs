using EnterpriseProjectManagement.Domain.Common;
using EnterpriseProjectManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseProjectManagement.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<ProjectTask> ProjectTasks => Set<ProjectTask>();
    public DbSet<TaskComment> TaskComments => Set<TaskComment>();
    public DbSet<MeetingNote> MeetingNotes => Set<MeetingNote>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Global Query Filter cho Soft Delete
        modelBuilder.Entity<User>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Project>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<ProjectMember>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<ProjectTask>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<TaskComment>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<MeetingNote>().HasQueryFilter(e => !e.IsDeleted);

        // User Cấu hình
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).IsRequired().HasMaxLength(150);
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(100);
        });

        // Project Cấu hình
        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.Code).IsUnique();
        });

        // ProjectMember Cấu hình
        modelBuilder.Entity<ProjectMember>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.Project)
                  .WithMany(p => p.Members)
                  .HasForeignKey(e => e.ProjectId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                  .WithMany(u => u.ProjectMemberships)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.ProjectId, e.UserId }).IsUnique();
        });

        // ProjectTask Cấu hình
        modelBuilder.Entity<ProjectTask>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(250);
            entity.Property(e => e.TaskCode).IsRequired().HasMaxLength(50);

            entity.HasOne(e => e.Project)
                  .WithMany(p => p.Tasks)
                  .HasForeignKey(e => e.ProjectId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Assignee)
                  .WithMany(u => u.AssignedTasks)
                  .HasForeignKey(e => e.AssigneeId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.ParentTask)
                  .WithMany(t => t.SubTasks)
                  .HasForeignKey(e => e.ParentTaskId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // TaskComment Cấu hình
        modelBuilder.Entity<TaskComment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Content).IsRequired();

            entity.HasOne(e => e.Task)
                  .WithMany(t => t.Comments)
                  .HasForeignKey(e => e.TaskId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // MeetingNote Cấu hình
        modelBuilder.Entity<MeetingNote>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(250);
            entity.Property(e => e.Content).IsRequired();

            entity.HasOne(e => e.Project)
                  .WithMany()
                  .HasForeignKey(e => e.ProjectId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries<BaseEntity>();
        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
