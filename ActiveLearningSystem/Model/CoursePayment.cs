using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class CoursePayment
{
    public int Id { get; set; }

    public int StudentCourseId { get; set; }

    public int PaidById { get; set; }

    public decimal Amount { get; set; }

    public bool IsPaid { get; set; }

    public DateOnly? PaidAt { get; set; }

    public virtual StudentCourse StudentCourse { get; set; } = null!;

    public virtual ICollection<VnPayPayment> VnPayPayments { get; set; } = new List<VnPayPayment>();
}
