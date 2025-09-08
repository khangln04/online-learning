namespace ActiveLearningSystem.ViewModel.MaketerViewModels
{
    public class ReportListItemVM
    {
        public int Id { get; set; }
        public string Title { get; set; } = null!;
        public DateTime CreatedDate { get; set; }
        public string UserName { get; set; } = null!;
        public string ContentDetail { get; set; } = null!;
        public int FileCount { get; set; }
        public int? CommentCount { get; set; }
        public string? InstructorName { get; set; }
        public string StatusName { get; set; } = null!;
    }
}
