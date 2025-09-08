using ActiveLearningSystem.ViewModel.InstructorViewModels;
namespace ActiveLearningSystem.ViewModel.InstructorViewModels
{
    public class QuizzManageVM
    {
        public int Id { get; set; }

        public string Title { get; set; } = null!;

        public string? Description { get; set; }

        public int QuestionCount { get; set; }

        public int TimeLimit { get; set; }

        public DateTime CreateAt { get; set; }

        public int ModuleId { get; set; }
        public string ModuleName { get; set; }
        public bool Status {  get; set; }
        public double RequiredScore { get; set; }
        public List<TopicByQuizzVM> Topics { get; set; } = new List<TopicByQuizzVM>();
    }
}
