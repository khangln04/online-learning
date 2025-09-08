using System.ComponentModel.DataAnnotations;

namespace ActiveLearningSystem.ViewModel.InstructorViewModels
{
    public class CreateModuleVM
    {
        [Required(ErrorMessage = "Tên không được để trống.")]
        [StringLength(100, ErrorMessage = "Không được vượt quá 100 ký tự.")]
        public string ModuleName { get; set; } = null!;
        [Required(ErrorMessage = "Mô tả không được để trống.")]
        public string Description { get; set; } = null!;
    }
}
