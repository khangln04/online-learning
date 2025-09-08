using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class Profile
{
    public int UserId { get; set; }

    public string Name { get; set; } = null!;

    public string Address { get; set; } = null!;

    public DateOnly Dob { get; set; }

    public bool Sex { get; set; }

    public string Phone { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? Avatar { get; set; }

    public DateOnly? CreatedDate { get; set; }

    public DateOnly? UpdatedDate { get; set; }

    public int RoleId { get; set; }

    public int AccountId { get; set; }

    public int? ParentId { get; set; }

    public virtual Account Account { get; set; } = null!;

    public virtual ICollection<Blog> Blogs { get; set; } = new List<Blog>();

    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();

    public virtual ICollection<Course> Courses { get; set; } = new List<Course>();

    public virtual ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();

    public virtual ICollection<Profile> InverseParent { get; set; } = new List<Profile>();

    public virtual Profile? Parent { get; set; }

    public virtual ICollection<ReportComment> ReportComments { get; set; } = new List<ReportComment>();

    public virtual ICollection<Report> ReportInstructors { get; set; } = new List<Report>();

    public virtual ICollection<Report> ReportReceivers { get; set; } = new List<Report>();

    public virtual ICollection<Report> ReportUsers { get; set; } = new List<Report>();

    public virtual Role Role { get; set; } = null!;

    public virtual ICollection<Salary> Salaries { get; set; } = new List<Salary>();

    public virtual ICollection<SalaryTable> SalaryTables { get; set; } = new List<SalaryTable>();

    public virtual ICollection<StudentCourse> StudentCourses { get; set; } = new List<StudentCourse>();
}
