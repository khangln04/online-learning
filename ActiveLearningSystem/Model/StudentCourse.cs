using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class StudentCourse
{
    public int StudentCourseId { get; set; }

    public int PupilId { get; set; }

    public int CourseId { get; set; }

    public int Status { get; set; }

    public virtual Course Course { get; set; } = null!;

    public virtual ICollection<CoursePayment> CoursePayments { get; set; } = new List<CoursePayment>();

    public virtual ICollection<CourseProgress> CourseProgresses { get; set; } = new List<CourseProgress>();

    public virtual Profile Pupil { get; set; } = null!;

    public virtual CourseStatus StatusNavigation { get; set; } = null!;
}
