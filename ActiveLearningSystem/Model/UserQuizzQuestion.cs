using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class UserQuizzQuestion
{
    public int Id { get; set; }

    public int UserQuizId { get; set; }

    public int Queestionid { get; set; }

    public virtual Question Queestion { get; set; } = null!;

    public virtual UserQuizz UserQuiz { get; set; } = null!;
}
