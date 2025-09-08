namespace ActiveLearningSystem.ViewModel.PupilViewModels
{
    public class LessonVM
    {
        public int Id { get; set; }
        public string Title { get; set; } = null!;
        public string Description { get; set; }
        public string Link { get; set; }
        public int VideoNum { get; set; }
        public int ModuleId { get; set; }
        public int Status { get; set; }
        public DateTime CreatedDate { get; set; }

        // Có thể có thêm:
        public string? SecuredVideoLink { get; set; }
    }

}
