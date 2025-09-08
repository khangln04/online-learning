using ActiveLearningSystem.Model;
using ActiveLearningSystem.ViewModel.AdminViewModels;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
namespace ActiveLearningSystem.Services.AdminServices
{
    public class AccountListService : IAccountListService
    {
        private readonly AlsContext _context;
        private readonly IMapper _mapper;
        private readonly PasswordHasher<Account> _hasher;
        public AccountListService(AlsContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
            _hasher = new PasswordHasher<Account>();
        }

        public List<AccountVM> GetAccounts(int page, int pageSize, string? search, bool? status)
        {
            var query = _context.Accounts
                .Include(a => a.Profiles)
                    .ThenInclude(p => p.Role)
                .Where(a => a.Profiles.Any(p => p.Role.Name != "Admin"))
                .AsQueryable();

            if (status.HasValue)
            {
                query = query.Where(a => a.Status == status.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var keyword = search.Trim().ToLower();
                query = query.Where(a =>
                    a.Username.ToLower().Contains(keyword) ||
                    a.Profiles.Any(p => p.Name.ToLower().Contains(keyword)));
            }

            query = query
                .OrderByDescending(a => a.CreatedDate)
                .ThenByDescending(a => a.Id);

            var result = query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return _mapper.Map<List<AccountVM>>(result);
        }


        public void UpdateAccountStatus(int accountId, bool status)
        {
            var account = _context.Accounts.FirstOrDefault(a => a.Id == accountId);

            if (account == null)
            {
                throw new Exception("Tài khoản không tồn tại.");
            }

            account.Status = status;
            account.UpdatedDate = DateOnly.FromDateTime(DateTime.Now);

            _context.SaveChanges();
        }

        public AccountDetailsVM? GetAccountDetailsById(int accountId)
        {
            var profile = _context.Profiles
                .Include(p => p.Role)
                .Include(p => p.Account)
                .FirstOrDefault(p => p.AccountId == accountId);

            return profile != null ? _mapper.Map<AccountDetailsVM>(profile) : null;
        }

        public void CreateAccountByAdmin(CreateAccount model)
        {
            var validRoles = new[] { "Manager", "Marketer", "Finance Manager", "Instructor" };

            model.Username = model.Username?.Trim();
            model.Password = model.Password?.Trim();
            model.Name = model.Name?.Trim();
            model.Email = model.Email?.Trim();
            model.Address = model.Address?.Trim();
            model.Phone = model.Phone?.Trim();
            model.RoleName = model.RoleName?.Trim();

            if (!validRoles.Contains(model.RoleName))
                throw new Exception($"Vai trò không hợp lệ. Chỉ được chọn: {string.Join(", ", validRoles)}");

            var role = _context.Roles.FirstOrDefault(r => r.Name == model.RoleName);
            if (role == null)
                throw new Exception("Vai trò không tồn tại trong hệ thống.");

            if (_context.Accounts.Any(a => a.Username == model.Username))
                throw new Exception("Tên đăng nhập đã tồn tại.");

            if (_context.Profiles.Any(p => p.Email == model.Email))
                throw new Exception("Email đã được sử dụng.");

            var today = DateOnly.FromDateTime(DateTime.Now);
            if (model.Dob >= today)
                throw new Exception("Ngày sinh phải trước ngày tạo tài khoản.");

            // ✅ Tạo account
            var account = new Account
            {
                Username = model.Username,
                Status = true,
                CreatedDate = today
            };

            account.Password = _hasher.HashPassword(account, model.Password);

            try
            {
                _context.Accounts.Add(account);
                _context.SaveChanges();

                var profile = _mapper.Map<Model.Profile>(model);
                profile.AccountId = account.Id;
                profile.RoleId = role.Id;
                profile.CreatedDate = today;

                _context.Profiles.Add(profile);
                _context.SaveChanges();
            }
            catch (DbUpdateException dbEx)
            {
                throw new Exception("Lỗi lưu dữ liệu: " + (dbEx.InnerException?.Message ?? dbEx.Message));
            }
        }



        public List<RoleDropdownVM> GetValidRoles()
        {
            return _context.Roles
                .Where(r => r.Id >= 2 && r.Id <= 5)
                .Select(r => new RoleDropdownVM
                {
                    Name = r.Name
                })
                .ToList();
        }
    }
}
