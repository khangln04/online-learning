using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class CourseProgress
{
    public int Id { get; set; }

    public int CourseStudentId { get; set; }

    public DateOnly? StartDate { get; set; }

    public DateOnly? LastAccess { get; set; }

    public bool Status { get; set; }

    public virtual StudentCourse CourseStudent { get; set; } = null!;

    public virtual ICollection<ModuleProgress> ModuleProgresses { get; set; } = new List<ModuleProgress>();
}
