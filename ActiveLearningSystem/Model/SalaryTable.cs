using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class SalaryTable
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string Content { get; set; } = null!;

    public string? Note { get; set; }

    public DateOnly Date { get; set; }

    public virtual Profile User { get; set; } = null!;
}
