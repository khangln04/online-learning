using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class Report
{
    public int Id { get; set; }

    public string Title { get; set; } = null!;

    public int UserId { get; set; }

    public int ReceiverId { get; set; }

    public int? InstructorId { get; set; }

    public string? ContentDetail { get; set; }

    public int StatusId { get; set; }

    public DateTime CreatedDate { get; set; }

    public DateTime? LastStatusUpdated { get; set; }

    public bool IsDeleted { get; set; }

    public virtual Profile? Instructor { get; set; }

    public virtual Profile Receiver { get; set; } = null!;

    public virtual ICollection<ReportComment> ReportComments { get; set; } = new List<ReportComment>();

    public virtual ICollection<ReportFile> ReportFiles { get; set; } = new List<ReportFile>();

    public virtual ReportStatus Status { get; set; } = null!;

    public virtual Profile User { get; set; } = null!;
}
