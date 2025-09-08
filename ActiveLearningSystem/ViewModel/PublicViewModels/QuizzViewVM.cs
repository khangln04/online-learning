using ActiveLearningSystem.Model;

namespace ActiveLearningSystem.ViewModel.PublicViewModels
{
    public class QuizzViewVM
    {
        public int Id { get; set; }

        public string Title { get; set; } = null!;

        public string? Description { get; set; }

        public int QuestionCount { get; set; }

        public int TimeLimit { get; set; }

        public DateTime CreateAt { get; set; }

        public int ModuleId { get; set; }

        public double RequiredScore { get; set; }

        public bool Status { get; set; }

        public virtual Module Module { get; set; } = null!;

        public virtual ICollection<QuizzTopic> QuizzTopics { get; set; } = new List<QuizzTopic>();

        public virtual ICollection<UserQuizz> UserQuizzs { get; set; } = new List<UserQuizz>();
    }
}
