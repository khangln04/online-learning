namespace ActiveLearningSystem.ViewModel.PupilviewModels
{
    public class CourseOverviewVM
    {
        public int StudentCourseId { get; set; }
        public int CourseId { get; set; }
        public string CourseName { get; set; } = null!;
        public string Image { get; set; }
        public string Status { get; set; } = null!;
        public string StatusName {  get; set; } = null!;
        public DateOnly? StartDate { get; set; }
        public DateOnly? LastAccess { get; set; }
    }

}
