using System.ComponentModel.DataAnnotations;

namespace ActiveLearningSystem.ViewModel.AdminViewModels
{
    public class CreateAccount : IValidatableObject
    {
        [Required(ErrorMessage = "Tên đăng nhập không được để trống.")]
        [StringLength(50, ErrorMessage = "Không được nhập quá kí tự cho phép.")]
        public string Username { get; set; } = null!;

        [Required(ErrorMessage = "Mật khẩu không được để trống.")]
        [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự.")]
        [RegularExpression(@"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$",
        ErrorMessage = "Mật khẩu phải chứa ít nhất 1 ký tự in hoa, 1 ký tự in thường, 1 chữ số và 1 ký tự đặc biệt.")]
        public string Password { get; set; } = null!;

        [Required(ErrorMessage = "Họ tên không được để trống.")]
        [StringLength(50, ErrorMessage = "Không được nhập quá kí tự cho phép.")]
        public string Name { get; set; } = null!;

        [Required(ErrorMessage = "Email không được để trống.")]
        [EmailAddress(ErrorMessage = "Email không đúng định dạng.")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "Địa chỉ không được để trống.")]
        [StringLength(200, ErrorMessage = "Không được nhập quá kí tự cho phép.")]
        public string Address { get; set; } = null!;

        [Required(ErrorMessage = "Ngày sinh không được để trống.")]
        public DateOnly Dob { get; set; }

        [Required(ErrorMessage = "Giới tính không được để trống.")]
        public Gender Sex { get; set; }


        [Required(ErrorMessage = "Số điện thoại không được để trống.")]
        [RegularExpression(@"^0\d{9}$", ErrorMessage = "Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số.")]
        [StringLength(200, ErrorMessage = "Không được nhập quá kí tự cho phép.")]
        public string Phone { get; set; } = null!;

        [Required(ErrorMessage = "Vai trò không được để trống.")]
        public string RoleName { get; set; } = null!;

        // Validate ngày sinh phải trước ngày tạo (hôm nay)
        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            var today = DateOnly.FromDateTime(DateTime.Now);

            if (Dob >= today)
            {
                yield return new ValidationResult(
                    "Ngày sinh phải trước ngày tạo tài khoản.",
                    new[] { nameof(Dob) }
                );
            }
            else
            {
                // Tính tuổi
                int age = today.Year - Dob.Year;
                if (Dob > today.AddYears(-age)) // Nếu chưa tới sinh nhật trong năm nay thì giảm 1 tuổi
                {
                    age--;
                }

                if (age < 18)
                {
                    yield return new ValidationResult(
                        "Người dùng phải đủ 18 tuổi trở lên.",
                        new[] { nameof(Dob) }
                    );
                }
            }
        }
    }

    public enum Gender
    {
        Nữ = 0,
        Nam = 1
    }
}

