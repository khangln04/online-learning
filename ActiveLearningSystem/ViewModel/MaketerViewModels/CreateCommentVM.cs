using System.ComponentModel.DataAnnotations;

namespace ActiveLearningSystem.ViewModel.MaketerViewModels
{
    public class CreateCommentVM
    {
        [Required]
        public string CommentText { get; set; } = null!;
    }
}
