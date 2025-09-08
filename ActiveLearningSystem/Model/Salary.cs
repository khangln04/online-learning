using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class Salary
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public decimal Salary1 { get; set; }

    public virtual Profile User { get; set; } = null!;
}
