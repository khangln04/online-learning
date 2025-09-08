namespace ActiveLearningSystem.ViewModel.InstructorViewModels
{
    public class TopicListVM
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public DateOnly CreatedDate { get; set; }
        public DateOnly? UpdatedDate { get; set; }
        public string? ClassName { get; set; }
        public string? CategoryName { get; set; }
    }
}
