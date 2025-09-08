using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class LessonProgress
{
    public int Id { get; set; }

    public int ModuleProgressId { get; set; }

    public int VideoId { get; set; }

    public DateOnly? LastWatched { get; set; }

    public bool Status { get; set; }

    public double? WatchedDuration { get; set; }

    public virtual ModuleProgress ModuleProgress { get; set; } = null!;

    public virtual Lesson Video { get; set; } = null!;
}
