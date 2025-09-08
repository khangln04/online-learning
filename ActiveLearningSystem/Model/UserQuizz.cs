using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class UserQuizz
{
    public int Id { get; set; }

    public int QuizId { get; set; }

    public DateTime StartAt { get; set; }

    public DateTime? SubmitAt { get; set; }

    public double? Duration { get; set; }

    public double? Score { get; set; }

    public int ModuleProgressId { get; set; }

    public bool? IsPass { get; set; }

    public virtual ModuleProgress ModuleProgress { get; set; } = null!;

    public virtual Quizz Quiz { get; set; } = null!;

    public virtual ICollection<UserAnswer> UserAnswers { get; set; } = new List<UserAnswer>();

    public virtual ICollection<UserQuizzQuestion> UserQuizzQuestions { get; set; } = new List<UserQuizzQuestion>();
}
