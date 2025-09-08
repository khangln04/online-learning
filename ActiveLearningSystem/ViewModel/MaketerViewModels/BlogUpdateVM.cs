namespace ActiveLearningSystem.ViewModel.MaketerViewModels
{
    public class BlogUpdateVM
    {
        public string Title { get; set; } = null!;
        public string Content { get; set; } = null!;
        public string Summary { get; set; } = null!;
        public string? Thumbnail { get; set; }
        public bool Status { get; set; }
    }
}
