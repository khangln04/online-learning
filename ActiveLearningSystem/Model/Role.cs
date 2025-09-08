using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class Role
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<Profile> Profiles { get; set; } = new List<Profile>();
}
