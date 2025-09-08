using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class Lesson
{
    public int Id { get; set; }

    public string Title { get; set; }

    public string Link { get; set; } = null!;

    public string Description { get; set; } = null!;

    public int VideoNum { get; set; }

    public int ModuleId { get; set; }

    public bool Status { get; set; }

    public DateOnly CreatedDate { get; set; }

    public DateOnly? UpdatedDate { get; set; }

    public int? DurationSeconds { get; set; }

    public virtual ICollection<LessonProgress> LessonProgresses { get; set; } = new List<LessonProgress>();

    public virtual Module Module { get; set; } = null!;
}
