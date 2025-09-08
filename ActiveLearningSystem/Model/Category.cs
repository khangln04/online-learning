using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class Category
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public DateOnly? CreatedDate { get; set; }

    public DateOnly? UpdatedDate { get; set; }

    public bool? Status { get; set; }

    public virtual ICollection<Course> Courses { get; set; } = new List<Course>();

    public virtual ICollection<Topic> Topics { get; set; } = new List<Topic>();
}
