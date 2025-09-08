using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class Feedback
{
    public int Id { get; set; }

    public string Content { get; set; } = null!;

    public int Rate { get; set; }

    public DateOnly CreatedDate { get; set; }

    public DateOnly? UpdatedDate { get; set; }

    public bool Status { get; set; }

    public int AuthorId { get; set; }

    public int CourseId { get; set; }

    public virtual Profile Author { get; set; } = null!;

    public virtual Course Course { get; set; } = null!;
}
