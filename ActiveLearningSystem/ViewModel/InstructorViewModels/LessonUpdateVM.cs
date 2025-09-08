using System.ComponentModel.DataAnnotations;

namespace ActiveLearningSystem.ViewModel.InstructorViewModels
{
    public class LessonUpdateVM
    {
        [Required(ErrorMessage = "Title không được để trống.")]
        public string Title { get; set; } = null!;

        [Required(ErrorMessage = "Link không được để trống.")]
        public string Link { get; set; } = null!;

        [Required(ErrorMessage = "Description không được để trống.")]
        public string Description { get; set; } = null!;
        [Required(ErrorMessage = "Duration  không được để trống.")]
        public int? DurationSeconds { get; set; }

        [Required(ErrorMessage = "VideoNum bắt buộc.")]
        public int VideoNum { get; set; }
    }
}
