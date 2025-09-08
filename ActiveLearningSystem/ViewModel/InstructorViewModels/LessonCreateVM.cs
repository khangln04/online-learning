namespace ActiveLearningSystem.ViewModel.InstructorViewModels
{
    using System.ComponentModel.DataAnnotations;

    public class LessonCreateVM
    {
        [Required(ErrorMessage = "Title không được để trống.")]
        public string Title { get; set; } = null!;

        [Required(ErrorMessage = "Link không được để trống.")]
        public string Link { get; set; } = null!;

        [Required(ErrorMessage = "Description không được để trống.")]
        public string Description { get; set; } = null!;
        [Required(ErrorMessage = "Duration  không được để trống.")]
        public int? DurationSeconds { get; set; }

        [Required(ErrorMessage = "ModuleId bắt buộc.")]
        public int ModuleId { get; set; }
    }

}
