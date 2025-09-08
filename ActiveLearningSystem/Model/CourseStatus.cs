using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class CourseStatus
{
    public int Id { get; set; }

    public string StatusName { get; set; } = null!;

    public virtual ICollection<StudentCourse> StudentCourses { get; set; } = new List<StudentCourse>();
}
