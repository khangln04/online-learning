using ActiveLearningSystem.Model;
using AutoMapper;
using System;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ActiveLearningSystem.ViewModel.AuthenViewModels;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;


namespace ActiveLearningSystem.Services.AuthenServices
{
    public class AuthService : IAuthService
    {
        private readonly AlsContext _context;
        private readonly IMapper _mapper;
        private readonly IConfiguration _config;
        private readonly PasswordHasher<Account> _hasher;

        public AuthService(AlsContext context, IMapper mapper, IConfiguration config)
        {
            _context = context;
            _mapper = mapper;
            _config = config;
            _hasher = new PasswordHasher<Account>();
        }

        public LoginResponseVM Login(LoginVM login)
        {
            // Tìm theo username
            var account = _context.Accounts
                .Include(a => a.Profiles)
                .ThenInclude(p => p.Role)
                .FirstOrDefault(a => a.Username == login.Username);

            if (account == null)
            {
                return new LoginResponseVM
                {
                    Success = false,
                    Message = "Sai tài khoản hoặc mật khẩu!"
                };
            }

            if (!account.Status)
            {
                return new LoginResponseVM
                {
                    Success = false,
                    Message = "Tài khoản của bạn không có quyền truy cập!"
                };
            }

            // Kiểm tra mật khẩu đã hash
            var verify = _hasher.VerifyHashedPassword(account, account.Password, login.Password);
            if (verify != PasswordVerificationResult.Success)
            {
                return new LoginResponseVM
                {
                    Success = false,
                    Message = "Sai tài khoản hoặc mật khẩu!"
                };
            }

            var profile = account.Profiles.FirstOrDefault();
            var roleName = profile?.Role?.Name ?? "Unknown";

            // ⚠️ Vẫn phải tạo JWT để truyền cho FE → dùng ở [Authorize]
            var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]!);
            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                new Claim("id", account.Id.ToString()),
                new Claim(ClaimTypes.Role, roleName)
            }),
                Expires = DateTime.UtcNow.AddHours(3),
                Issuer = _config["Jwt:Issuer"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            string tokenString = tokenHandler.WriteToken(token);

            return new LoginResponseVM
            {
                Username = account.Username,
                Name = profile?.Name ?? "No name",
                Avatar = profile?.Avatar,
                Email = profile?.Email,
                Role = roleName,
                Token = tokenString,
                Success = true,
                Message = "Đăng nhập thành công!"
            };
        }
    }
}
