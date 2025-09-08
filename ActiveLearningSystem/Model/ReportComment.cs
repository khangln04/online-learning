using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class ReportComment
{
    public int Id { get; set; }

    public int ReportId { get; set; }

    public int UserId { get; set; }

    public string CommentText { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public virtual Report Report { get; set; } = null!;

    public virtual Profile User { get; set; } = null!;
}
