using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class Comment
{
    public int Id { get; set; }

    public int BlogId { get; set; }

    public int AuthorId { get; set; }

    public string Content { get; set; } = null!;

    public DateOnly CreatedDate { get; set; }

    public virtual Profile Author { get; set; } = null!;

    public virtual Blog Blog { get; set; } = null!;
}
