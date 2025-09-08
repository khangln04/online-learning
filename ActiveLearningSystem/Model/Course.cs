using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class Course
{
    public int CourseId { get; set; }

    public string CourseName { get; set; } = null!;

    public DateOnly CreatedDate { get; set; }

    public DateOnly? UpdatedDate { get; set; }

    public string Description { get; set; } = null!;

    public string? Image { get; set; }

    public decimal Price { get; set; }

    public bool Status { get; set; }

    public int AuthorId { get; set; }

    public int CategoryId { get; set; }

    public int? ClassId { get; set; }

    public virtual Profile Author { get; set; } = null!;

    public virtual Category Category { get; set; } = null!;

    public virtual Class? Class { get; set; }

    public virtual ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();

    public virtual ICollection<Module> Modules { get; set; } = new List<Module>();

    public virtual ICollection<StudentCourse> StudentCourses { get; set; } = new List<StudentCourse>();
}
