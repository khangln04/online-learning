namespace ActiveLearningSystem.ViewModel.InstructorViewModels
{
    public class QuestionCreateVM
    {
       
        public string Content { get; set; } = null!;

        public int TopicId { get; set; }

    }
    public class AnswerCreateVM
    {
   
        public string Content { get; set; } = null!;

        public bool IsCorrect { get; set; }
    }
    public class QuestionListVM
    {
        public int Id { get; set; }

        public string Content { get; set; } = null!;

        public int TopicId { get; set; }
        public string TopicName { get; set; }
        public List<AnswerListVM> Answers { get; set; } 

    }
    public class AnswerListVM
    {
        public int Id { get; set; }

        public int QuesId { get; set; }

        public string Content { get; set; } = null!;

        public bool IsCorrect { get; set; }
    }
    public class QuestionWithAnswersVM
    {
        public QuestionCreateVM Question { get; set; }
        public List<AnswerCreateVM> Answers { get; set; }
    }
}
