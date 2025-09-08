using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class Class
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<Course> Courses { get; set; } = new List<Course>();

    public virtual ICollection<Topic> Topics { get; set; } = new List<Topic>();
}
