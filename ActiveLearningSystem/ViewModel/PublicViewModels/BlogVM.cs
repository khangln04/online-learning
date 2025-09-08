namespace ActiveLearningSystem.ViewModel.PublicViewModels
{
    public class BlogVM
    {
        public int Id { get; set; }

        public string Title { get; set; } = null!;

        public string Content { get; set; } = null!;

        public string Summary { get; set; } = null!;

        public string? Thumbnail { get; set; }

        public int AuthorId { get; set; }
        public string AuthorName { get; set; }

        public bool Status { get; set; }

        public DateOnly CreatedDate { get; set; }

        public DateOnly? UpdatedDate { get; set; }
        public int TotalComments { get; set; }

        public List<CommentVM> Comments { get; set; } = new();
    }
}
