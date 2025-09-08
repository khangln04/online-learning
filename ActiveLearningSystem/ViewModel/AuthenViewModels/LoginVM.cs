using System.ComponentModel.DataAnnotations;

namespace ActiveLearningSystem.ViewModel.AuthenViewModels
{
    public class LoginVM
    {
        [Required(ErrorMessage = "Username không được để trống")]
        [MaxLength(50, ErrorMessage = "Nhập quá kí tự cho phép")]
        public string Username { get; set; }

        [Required(ErrorMessage = "Password không được để trống")]
        [MaxLength(50, ErrorMessage = "Nhập quá kí tự cho phép")]
        public string Password { get; set; }
    }
}
