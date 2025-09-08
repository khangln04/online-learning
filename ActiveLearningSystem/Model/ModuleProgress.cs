using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class ModuleProgress
{
    public int Id { get; set; }

    public int CourseProcessId { get; set; }

    public int ModuleId { get; set; }

    public DateOnly? StartDate { get; set; }

    public DateOnly? LastAccess { get; set; }

    public bool Status { get; set; }

    public virtual CourseProgress CourseProcess { get; set; } = null!;

    public virtual ICollection<LessonProgress> LessonProgresses { get; set; } = new List<LessonProgress>();

    public virtual Module Module { get; set; } = null!;

    public virtual ICollection<UserQuizz> UserQuizzs { get; set; } = new List<UserQuizz>();
}
