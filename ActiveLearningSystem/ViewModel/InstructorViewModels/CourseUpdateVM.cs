namespace ActiveLearningSystem.ViewModel.InstructorViewModels
{
    public class CourseUpdateVM
    {
        public string CourseName { get; set; } = null!;
        public string Description { get; set; } = null!;
        public decimal Price { get; set; }

        public int CategoryId { get; set; }
        public int ClassId { get; set; }
        //public IFormFile? ImageFile { get; set; }  // ảnh mới (nếu có)

    }
}
