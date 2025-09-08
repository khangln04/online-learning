namespace ActiveLearningSystem.ViewModel.InstructorViewModels
{
    public class CourseCreateVM
    {
        public string CourseName { get; set; } = null!;
        public string Description { get; set; } = null!;
        public int CategoryId { get; set; }
        public int ClassId { get; set; }

        //public IFormFile ImageFile { get; set; } = null!;  // ảnh khi tạo mới (bắt buộc)
    }
}
