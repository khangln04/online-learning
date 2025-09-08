using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class Blog
{
    public int Id { get; set; }

    public string Title { get; set; } = null!;

    public string Content { get; set; } = null!;

    public string Summary { get; set; } = null!;

    public string? Thumbnail { get; set; }

    public int AuthorId { get; set; }

    public bool Status { get; set; }

    public DateOnly CreatedDate { get; set; }

    public DateOnly? UpdatedDate { get; set; }

    public virtual Profile Author { get; set; } = null!;

    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
}
