using System.ComponentModel.DataAnnotations;

namespace ActiveLearningSystem.ViewModel.PublicViewModels
{
    public class EditMyProfileVM
    {
        [Required(ErrorMessage = "Tên không được bỏ trống.")]
        [StringLength(50, ErrorMessage = "Tên tối đa 50 ký tự.")]
        public string Name { get; set; }

        [Required(ErrorMessage = "Địa chỉ không được bỏ trống.")]
        [StringLength(200, ErrorMessage = "Địa chỉ tối đa 200 ký tự.")]
        public string Address { get; set; }

        [Required(ErrorMessage = "Ngày sinh là bắt buộc.")]
        public DateOnly Dob { get; set; }

        [Required(ErrorMessage = "Giới tính không được bỏ trống.")]
        [Range(0, 1, ErrorMessage = "Giới tính phải là 0 (Nữ) hoặc 1 (Nam).")]
        public bool Sex { get; set; } // ✅ 0 = Nữ, 1 = Nam

        [Required(ErrorMessage = "Số điện thoại không được để trống.")]
        [RegularExpression(@"^(0|\\+84)[0-9]{9,10}$", ErrorMessage = "Số điện thoại không hợp lệ.")]
        [StringLength(50, ErrorMessage = "Số điện thoại tối đa 50 ký tự.")]
        public string Phone { get; set; }
    }
}
