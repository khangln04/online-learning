using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class Module
{
    public int Id { get; set; }

    public string ModuleName { get; set; } = null!;

    public string Description { get; set; } = null!;

    public int ModuleNum { get; set; }

    public bool Status { get; set; }

    public int CourseId { get; set; }

    public DateOnly CreatedDate { get; set; }

    public DateOnly? UpdatedDate { get; set; }

    public virtual Course Course { get; set; } = null!;

    public virtual ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();

    public virtual ICollection<ModuleProgress> ModuleProgresses { get; set; } = new List<ModuleProgress>();

    public virtual ICollection<Quizz> Quizzs { get; set; } = new List<Quizz>();
}
