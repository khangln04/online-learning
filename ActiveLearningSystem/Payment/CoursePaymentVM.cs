namespace ActiveLearningSystem.Payment
{
    public class CoursePaymentVM
    {
        public int Id { get; set; }
        public int StudentCourseId { get; set; }
        public decimal Amount { get; set; }
        public bool IsPaid { get; set; }
        public DateOnly? PaidAt { get; set; }
        public string CourseName { get; set; } = null!;
        public string StudentName { get; set; } = null!;
        public List<VnPayPaymentVM> VnPayPayments { get; set; } = new();

    }
}
