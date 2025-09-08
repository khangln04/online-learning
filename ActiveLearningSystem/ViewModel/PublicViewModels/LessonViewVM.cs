namespace ActiveLearningSystem.ViewModel.PublicViewModels
{
    public class LessonViewVM
    {
        public int Id { get; set; }

        public string Title { get; set; } = null!;
        public string Link { get; set; } = null!;

        public string Description { get; set; } = null!;

        public int VideoNum { get; set; }
        public int? DurationSeconds { get; set; }

        public int ModuleId { get; set; }

        public bool Status { get; set; }

        public DateOnly CreatedDate { get; set; }

        public DateOnly? UpdatedDate { get; set; }
        public string? SecuredVideoLink { get; set; }
    }
}
