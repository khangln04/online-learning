namespace ActiveLearningSystem.ViewModel.MaketerViewModels
{
    public class CommentReportVM
    {
        public int Id { get; set; }
        public string CommentText { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public string UserName { get; set; } = null!;
        public string RoleName { get; set; } = null!;
    }
}
