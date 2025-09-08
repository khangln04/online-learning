using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class Question
{
    public int Id { get; set; }

    public string? Content { get; set; }

    public DateOnly CreatedDate { get; set; }

    public DateOnly? UpdatedDate { get; set; }

    public int TopicId { get; set; }

    public virtual ICollection<Answer> Answers { get; set; } = new List<Answer>();

    public virtual Topic Topic { get; set; } = null!;

    public virtual ICollection<UserAnswer> UserAnswers { get; set; } = new List<UserAnswer>();

    public virtual ICollection<UserQuizzQuestion> UserQuizzQuestions { get; set; } = new List<UserQuizzQuestion>();
}
