using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class ReportFile
{
    public int Id { get; set; }

    public int ReportId { get; set; }

    public string FilePath { get; set; } = null!;

    public DateTime? UploadedAt { get; set; }

    public virtual Report Report { get; set; } = null!;
}
