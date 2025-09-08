using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class ReportStatus
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<Report> Reports { get; set; } = new List<Report>();
}
