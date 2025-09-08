using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class QuizzTopic
{
    public int Id { get; set; }

    public int QuizzId { get; set; }

    public int TopicId { get; set; }

    public virtual Quizz Quizz { get; set; } = null!;

    public virtual Topic Topic { get; set; } = null!;
}
