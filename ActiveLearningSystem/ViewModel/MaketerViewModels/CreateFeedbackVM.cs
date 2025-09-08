// File: ViewModel/MaketerViewModels/CreateFeedbackVM.cs
namespace ActiveLearningSystem.ViewModel.MaketerViewModels
{
    public class CreateFeedbackVM
    {
        public int CourseId { get; set; }
        public int Rate { get; set; }
        public string Content { get; set; } = "";
    }
}
