namespace ActiveLearningSystem.ViewModel.ParentViewModels
{
    public class PaidCourseHistoryVM
    {
        public int coursepaymentId { get; set; }
        public string CourseName { get; set; } = null!;
        public decimal Amount { get; set; }
        public DateOnly? PaidAt { get; set; }
        public bool IsPaid { get; set; } 
    }
}
