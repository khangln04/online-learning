using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class Topic
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public DateOnly CreatedDate { get; set; }

    public DateOnly? UpdatedDate { get; set; }

    public int? ClassId { get; set; }

    public int? CategoryId { get; set; }

    public virtual Category? Category { get; set; }

    public virtual Class? Class { get; set; }

    public virtual ICollection<Question> Questions { get; set; } = new List<Question>();

    public virtual ICollection<QuizzTopic> QuizzTopics { get; set; } = new List<QuizzTopic>();
}
