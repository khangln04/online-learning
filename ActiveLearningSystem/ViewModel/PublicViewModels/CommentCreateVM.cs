using System.ComponentModel.DataAnnotations;

namespace ActiveLearningSystem.ViewModel.PublicViewModels
{
    public class CommentCreateVM
    {
        [Required(ErrorMessage = "Nội dung không được để trống.")]
        public string Content { get; set; } = null!;
    }
}
