using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class UserAnswer
{
    public int Id { get; set; }

    public int UserQuizzId { get; set; }

    public int QuestionId { get; set; }

    public int? AnswerId { get; set; }

    public DateTime? AnswerAt { get; set; }

    public bool? IsCorrect { get; set; }

    public virtual Answer? Answer { get; set; }

    public virtual Question Question { get; set; } = null!;

    public virtual UserQuizz UserQuizz { get; set; } = null!;
}
