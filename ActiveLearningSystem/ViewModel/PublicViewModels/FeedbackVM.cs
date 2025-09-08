namespace ActiveLearningSystem.ViewModel.PublicViewModels
{
    public class FeedbackVM
    {
        public int Id { get; set; }

        public string Content { get; set; } = null!;

        public double Rate { get; set; }

        public DateOnly CreatedDate { get; set; }
        public string AuthorName { get; set; } = null!;
        public string Avatar { get; set; }
        public string CourseName { get; set; } = null!;

    }
}
