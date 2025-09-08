using System.ComponentModel.DataAnnotations;

namespace ActiveLearningSystem.ViewModel.MaketerViewModels
{
    public class UpdateStatusVM
    {
        [Required]
        public int NewStatusId { get; set; }
        public int? InstructorId { get; set; } // Chỉ cần khi Manager approve
    }
}
