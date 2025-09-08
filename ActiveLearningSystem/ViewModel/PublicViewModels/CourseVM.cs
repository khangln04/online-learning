namespace ActiveLearningSystem.ViewModel.PublicViewModels
{
    public class CourseVM
    {
        public int CourseId { get; set; }

        public string CourseName { get; set; } = null!;

        public DateOnly CreatedDate { get; set; }

        public DateOnly? UpdatedDate { get; set; }

        public string Description { get; set; } = null!;

        public string? Image { get; set; }

        public decimal Price { get; set; }
        public double AverageRating { get; set; }
        public bool Status { get; set; }
        public string AuthorName { get; set; }

        public string CategoryName { get; set; }
        public string ClassName { get; set; }
        public int AuthorId { get; set; }

        public int CategoryId { get; set; }
        public string VideoLink { get; set; }
        public string SecuredLink { get; set; }
        public int? ClassId { get; set; }
        public virtual List<ModuleVM> Modules { get; set; }
        public List<FeedbackVM> Feedbacks { get; set; }
    }
}
