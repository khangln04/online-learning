using ActiveLearningSystem.Helpers;
using ActiveLearningSystem.Model;
using ActiveLearningSystem.Services.MailService;
using ActiveLearningSystem.ViewModel.AuthenViewModels;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace ActiveLearningSystem.Services.AuthenServices
{
    public class AccountService : IAccountService
    {
        private readonly AlsContext _context;
        private readonly IMapper _mapper;
        private readonly PasswordHasher<Account> _hasher;
        private readonly IMailService _mailService;
        private readonly IConfiguration _config;
        private readonly int _maxResendAttempts = 3;
        private readonly Dictionary<string, int> _resendAttempts = new();

        public AccountService(AlsContext context, IMapper mapper, IMailService mailService, IConfiguration config)
        {
            _context = context;
            _mapper = mapper;
            _hasher = new PasswordHasher<Account>();
            _mailService = mailService;
            _config = config;
        }

        public async Task<string> PreRegisterAsync(CreateAccountVM model)
        {
            model.Name = model.Name?.Trim();
            model.Address = model.Address?.Trim();
            model.Phone = model.Phone?.Trim();
            model.Email = model.Email?.Trim();
            model.Username = model.Username?.Trim().ToLower();
            model.Password = model.Password?.Trim();

            if (string.IsNullOrWhiteSpace(model.Name) || model.Name.Length > 50)
                throw new Exception("Tên không được để trống và tối đa 50 ký tự.");
            if (string.IsNullOrWhiteSpace(model.Address) || model.Address.Length > 200)
                throw new Exception("Địa chỉ không được để trống và tối đa 200 ký tự.");

            // Birthday
            if (model.Dob == null)
                throw new Exception("Ngày sinh là bắt buộc.");
            if ((DateTime.Now.Year - model.Dob.Year) < 15)
                throw new Exception("Người dùng phải trên 15 tuổi.");

            // Sex
            if (model.Sex == null)
                throw new Exception("Giới tính không được bỏ trống.");

            if (!Regex.IsMatch(model.Email, @"^[\w\.-]+@[\w\.-]+\.\w+$"))
                throw new Exception("email phải chứa kí tự @ ");
            // Phone
            if (string.IsNullOrWhiteSpace(model.Phone) ||
                !Regex.IsMatch(model.Phone, @"^0\d{9,10}$"))
                throw new Exception("Số điện thoại không hợp lệ (bắt đầu bằng 0, theo sau 9-10 chữ số).");
            if (await _context.Profiles.AnyAsync(p => p.Phone == model.Phone))
                throw new Exception("Số điện thoại đã được sử dụng.");

            if (string.IsNullOrWhiteSpace(model.Username) || model.Username.Length < 4 || model.Username.Length > 50)
                throw new Exception("Username phải từ 4-50 ký tự.");

            if (await _context.Accounts.AnyAsync(a => a.Username.ToLower() == model.Username.ToLower()))
                throw new Exception("Tên đăng nhập đã tồn tại.");
            if (await _context.Profiles.AnyAsync(p => p.Email == model.Email))
                throw new Exception("Email đã được sử dụng.");
            if (await _context.Profiles.AnyAsync(p => p.Phone == model.Phone))
                throw new Exception("Số điện thoại đã được sử dụng.");
            if (model.RoleId != 6 && model.RoleId != 7)
                throw new Exception("Role không hợp lệ.");

            // Password
            if (string.IsNullOrWhiteSpace(model.Password))
                throw new Exception("Mật khẩu bắt buộc.");
            if (model.Password.Length < 8 || model.Password.Length > 50)
                throw new Exception("Mật khẩu phải 8-50 ký tự.");
            if (!Regex.IsMatch(model.Password, @"[A-Z]"))
                throw new Exception("Mật khẩu phải có ít nhất 1 chữ hoa.");
            if (!Regex.IsMatch(model.Password, @"[a-z]"))
                throw new Exception("Mật khẩu phải có ít nhất 1 chữ thường.");
            if (!Regex.IsMatch(model.Password, @"\d"))
                throw new Exception("Mật khẩu phải có ít nhất 1 chữ số.");
            if (!Regex.IsMatch(model.Password, "[^a-zA-Z0-9\\s]"))
                throw new Exception("Mật khẩu phải có ít nhất 1 ký tự đặc biệt.");

            var otp = new Random().Next(100000, 999999).ToString();
            try
            {
                await _mailService.SendEmailAsync(
                    model.Email,
                    "Mã xác thực đăng ký tài khoản ALS",
                    $"<h3>Mã OTP của bạn là: <b>{otp}</b></h3><p>Vui lòng nhập mã này trong vòng 5 phút để xác thực email.</p>"
                );
            }
            catch (SmtpException ex)
            {
                if (ex.StatusCode == SmtpStatusCode.MailboxUnavailable) // Mã 550: Mailbox unavailable
                    throw new Exception("Email không hợp lệ hoặc không tồn tại.");
                throw new Exception("Không thể gửi email. Vui lòng thử lại sau.");
            }
            catch (Exception)
            {
                throw new Exception("Không thể gửi email. Vui lòng thử lại sau.");
            }

            var jwtToken = OtpTokenHelper.CreateOtpToken(model, otp, _config["Jwt:Issuer"], _config["Jwt:Key"]);
            return jwtToken;
        }

        // Services/AuthenServices/AccountService.cs
        public async Task<string> ResendOtpAsync(ResendOtpVM model)
        {
            var payload = OtpTokenHelper.DecodeOtpToken<CreateAccountVM>(model.Token, out var otp, out var expiredAt);

            if (expiredAt < DateTime.UtcNow)
                throw new Exception("Token đã hết hạn. Vui lòng bắt đầu lại quá trình đăng ký.");

            string emailToUse = payload.Email; // ✅ luôn lấy email từ pre-register

            if (await _context.Profiles.AnyAsync(p => p.Email == emailToUse))
                throw new Exception("Email đã được sử dụng.");

            var tokenKey = model.Token.GetHashCode().ToString();
            if (_resendAttempts.ContainsKey(tokenKey) && _resendAttempts[tokenKey] >= _maxResendAttempts)
                throw new Exception($"Đã đạt giới hạn {_maxResendAttempts} lần gửi lại. Vui lòng bắt đầu lại.");

            var newOtp = new Random().Next(100000, 999999).ToString();
            try
            {
                await _mailService.SendEmailAsync(
                    emailToUse,
                    "Mã xác thực đăng ký tài khoản ALS (Gửi lại)",
                    $"<h3>Mã OTP của bạn là: <b>{newOtp}</b></h3><p>Vui lòng nhập mã này trong vòng 5 phút để xác thực email.</p>"
                );
                _resendAttempts[tokenKey] = _resendAttempts.GetValueOrDefault(tokenKey, 0) + 1;
            }
            catch (SmtpException ex)
            {
                if (ex.StatusCode == SmtpStatusCode.MailboxUnavailable)
                    throw new Exception("Email không hợp lệ hoặc không tồn tại.");
                throw new Exception("Không thể gửi email. Vui lòng thử lại sau.");
            }

            return OtpTokenHelper.CreateOtpToken(payload, newOtp, _config["Jwt:Issuer"], _config["Jwt:Key"]);
        }

        public async Task<bool> VerifyAndCreateAccountAsync(string token, string otp)
        {
            var payload = OtpTokenHelper.DecodeOtpToken<CreateAccountVM>(token, out var otpFromToken, out var expiredAt);

            if (otp != otpFromToken)
                throw new Exception("OTP không chính xác.");
            if (expiredAt < DateTime.UtcNow)
                throw new Exception("OTP đã hết hạn.");

            var account = _mapper.Map<Account>(payload);
            account.Password = _hasher.HashPassword(account, payload.Password); // ⚠️ Hash tại đây
            account.IsVerified = true;
            account.Status = true;

            await _context.Accounts.AddAsync(account);
            await _context.SaveChangesAsync();

            var profile = _mapper.Map<Model.Profile>(payload);
            profile.AccountId = account.Id;

            await _context.Profiles.AddAsync(profile);
            await _context.SaveChangesAsync();

            return true;
        }

        private string HashToken(string token)
        {
            using var sha = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(token);
            var hash = sha.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }

        //  pre reset pass function
        public async Task<bool> RequestResetPasswordAsync(string email)
        {
            var profile = await _context.Profiles.Include(p => p.Account)
                .FirstOrDefaultAsync(p => p.Email == email);
            if (profile == null) return false;

            var rawToken = Guid.NewGuid().ToString(); // Gửi qua mail
            var hashedToken = HashToken(rawToken);    // Lưu vào DB

            var expiration = DateTime.UtcNow.AddMinutes(2);
            var resetToken = new PasswordResetToken
            {
                AccountId = profile.AccountId,
                Token = hashedToken,
                Expiration = expiration,
                IsUsed = false
            };

            await _context.PasswordResetTokens.AddAsync(resetToken);
            await _context.SaveChangesAsync();

            var resetLink = $"https://localhost:3000/forget2?token={rawToken}";

            var subject = "ALS - Reset mật khẩu";
            var body = $"<p>Click để đặt lại mật khẩu:</p><a href='{resetLink}'>{resetLink}</a><p>Link hết hạn sau 2 phút.</p>";

            await _mailService.SendEmailAsync(email, subject, body);
            return true;
        }

        // reset pass function
        public async Task<bool> ResetPasswordAsync(string token, string newPassword)
        {
            var hashedToken = HashToken(token);
            var resetToken = await _context.PasswordResetTokens
                .FirstOrDefaultAsync(t => t.Token == hashedToken && !t.IsUsed && t.Expiration > DateTime.UtcNow);

            if (resetToken == null) return false;

            var account = await _context.Accounts.FindAsync(resetToken.AccountId);
            if (account == null) return false;

            // ✅ Hash mật khẩu mới
            account.Password = _hasher.HashPassword(account, newPassword);

            resetToken.IsUsed = true;
            resetToken.Expiration = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        // change pass function 
        public async Task<bool> ChangePasswordAsync(ChangePasswordVM model, int accountId)
        {
            var oldPass = model.OldPassword?.Trim();
            var newPass = model.NewPassword?.Trim();
            var confirmPass = model.ConfirmPassword?.Trim();

            if (string.IsNullOrWhiteSpace(oldPass))
                throw new Exception("Mật khẩu cũ là bắt buộc.");

            if (string.IsNullOrWhiteSpace(newPass))
                throw new Exception("Mật khẩu mới là bắt buộc và không được phép chỉ chứa khoảng trắng.");

            if (newPass.Length < 8 || newPass.Length > 50)
                throw new Exception("Mật khẩu mới phải có độ dài từ 8 đến 50 ký tự.");

            if (!Regex.IsMatch(newPass, @"[A-Z]"))
                throw new Exception("Mật khẩu mới phải chứa ít nhất 1 chữ cái in hoa.");

            if (!Regex.IsMatch(newPass, @"[a-z]"))
                throw new Exception("Mật khẩu mới phải chứa ít nhất 1 chữ cái in thường.");

            if (!Regex.IsMatch(newPass, @"\d"))
                throw new Exception("Mật khẩu mới phải chứa ít nhất 1 chữ số.");

            if (!Regex.IsMatch(newPass, @"[^a-zA-Z0-9\s]"))
                throw new Exception("Mật khẩu mới phải chứa ít nhất 1 ký tự đặc biệt.");

            if (newPass != confirmPass)
                throw new Exception("Mật khẩu xác nhận phải giống với mật khẩu mới.");

            var account = await _context.Accounts.FindAsync(accountId);
            if (account == null)
                throw new Exception("Tài khoản không tồn tại.");

            var verify = _hasher.VerifyHashedPassword(account, account.Password, oldPass);
            if (verify != PasswordVerificationResult.Success)
                throw new Exception("Mật khẩu cũ không đúng.");

            account.Password = _hasher.HashPassword(account, newPass);
            account.UpdatedDate = DateOnly.FromDateTime(DateTime.UtcNow);
            await _context.SaveChangesAsync();

            return true;
        }

    }
}
