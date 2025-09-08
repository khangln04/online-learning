namespace ActiveLearningSystem.ViewModel.PublicViewModels
{
    public class CommentVM
    {
        public int Id { get; set; }
        public string Content { get; set; } = null!;
        public string AuthorName { get; set; } = null!;
        public string? AuthorAvatar { get; set; }
        public DateOnly CreatedDate { get; set; }
    }
}
