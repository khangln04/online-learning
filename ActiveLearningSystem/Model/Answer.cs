using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class Answer
{
    public int Id { get; set; }

    public int QuesId { get; set; }

    public string Content { get; set; } = null!;

    public bool IsCorrect { get; set; }

    public virtual Question Ques { get; set; } = null!;

    public virtual ICollection<UserAnswer> UserAnswers { get; set; } = new List<UserAnswer>();
}
