namespace ActiveLearningSystem.ViewModel.InstructorViewModels
{
    public class UpdateQuizzVM
    {

        public string Title { get; set; } = null!; 

        public string? Description { get; set; } 

        public int QuestionCount { get; set; } 

        public int TimeLimit { get; set; } 

        public double RequiredScore { get; set; } 

        public int ModuleId { get; set; } 

        public bool Status { get; set; } 
    }
}
