// File: ViewModel/MaketerViewModels/CourseDetailVM.cs
namespace ActiveLearningSystem.ViewModel.MaketerViewModels
{
    public class CourseDetailVM
    {
        public int CourseId { get; set; }
        public string CourseName { get; set; } = "";
        public string InstructorName { get; set; } = "";
        public DateTime UpdatedDate { get; set; }
        public string Description { get; set; } = "";
        public string Level { get; set; } = "";   // ✅ thêm cấp độ khóa học (lớp 10,11,12)
        public int TotalFeedback { get; set; }
        public double AverageRate { get; set; }
        public string? Image { get; set; }
        public decimal Price { get; set; }
        public int RegisteredNotPaid { get; set; }
        public int PaidUsers { get; set; }
        public int CompletedUsers { get; set; }
        public decimal TotalRevenue { get; set; }
        public List<AddFeedbackVM> Feedbacks { get; set; } = new();
    }

    public class AddFeedbackVM
    {
        public string UserName { get; set; } = "";
        public int Rate { get; set; }
        public DateTime CreatedDate { get; set; }
        public string Content { get; set; } = "";
    }
}
