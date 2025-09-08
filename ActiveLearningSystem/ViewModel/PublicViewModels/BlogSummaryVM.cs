namespace ActiveLearningSystem.ViewModel.PublicViewModels
{
    public class BlogSummaryVM
    {
        public int BlogId { get; set; }
        public string Title { get; set; } = null!;
        public string Summary { get; set; } = null!;
        public string? Thumbnail { get; set; }
        public DateOnly CreatedDate { get; set; }
        public string AuthorName { get; set; } = null!;
    }
}
