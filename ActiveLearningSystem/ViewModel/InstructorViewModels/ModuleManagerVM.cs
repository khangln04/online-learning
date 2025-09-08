namespace ActiveLearningSystem.ViewModel.InstructorViewModels
{
    public class ModuleManagerVM
    {
        public int CourseId { get; set; }
        public int ModuleId { get; set; }
        public string ModuleName { get; set; } = null!;
        public string Description { get; set; } = null!;
        public bool Status { get; set; }
        public DateOnly CreatedDate { get; set; }
        public DateOnly? UpdatedDate { get; set; }
    }
}
