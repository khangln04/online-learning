using ActiveLearningSystem.Model;
using ActiveLearningSystem.ViewModel.PublicViewModels;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ActiveLearningSystem.Services.PublicServices
{
    public class MyProfileService : IMyProfileService
    {
        private readonly AlsContext _context;
        private readonly IMapper _mapper;

        private const int ROLE_PUPIL = 6;
        private const int ROLE_PARENT = 7;

        public MyProfileService(AlsContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<MyProfileVM> GetMyProfileAsync(int userId)
        {
            try
            {
                // Truy ngược từ AccountId trong Profiles
                var profile = await _context.Profiles
                    .Include(p => p.Role)
                    .FirstOrDefaultAsync(p => p.AccountId == userId);

                if (profile == null)
                    throw new Exception("Không tìm thấy hồ sơ người dùng.");

                var result = _mapper.Map<MyProfileVM>(profile);

                if (profile.RoleId == ROLE_PUPIL && profile.ParentId != null)
                {
                    var parent = await _context.Profiles.FindAsync(profile.ParentId);
                    result.LinkedParentEmail = parent?.Email;
                }
                else if (profile.RoleId == ROLE_PARENT)
                {
                    result.LinkedChildrenEmails = await _context.Profiles
                        .Where(p => p.ParentId == profile.UserId)
                        .Select(p => p.Email)
                        .ToListAsync();
                }

                return result;
            }
            catch (Exception ex)
            {
                throw new Exception($"Lỗi khi lấy hồ sơ người dùng: {ex.Message}");
            }
        }

        // edit profile function
        public async Task<bool> LinkAccountAsync(int currentUserId, LinkAccountVM vm)
        {
            try
            {
                var currentProfile = await _context.Profiles
                    .FirstOrDefaultAsync(p => p.AccountId == currentUserId);

                if (currentProfile == null)
                    throw new Exception("Không tìm thấy hồ sơ hiện tại.");

                var target = await _context.Profiles
                    .FirstOrDefaultAsync(p => p.Email == vm.Email);

                if (target == null)
                    throw new Exception("Không tìm thấy tài khoản với email này.");

                if (currentProfile.RoleId == ROLE_PUPIL)
                {
                    if (target.RoleId != ROLE_PARENT)
                        throw new Exception("Chỉ có thể liên kết với tài khoản phụ huynh.");

                    currentProfile.ParentId = target.UserId;
                }
                else if (currentProfile.RoleId == ROLE_PARENT)
                {
                    if (target.RoleId != ROLE_PUPIL)
                        throw new Exception("Chỉ có thể liên kết với tài khoản học sinh.");

                    target.ParentId = currentProfile.UserId;
                }
                else throw new Exception("Vai trò không hợp lệ.");

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                throw new Exception($"Lỗi khi liên kết tài khoản: {ex.Message}");
            }
        }

        public async Task<bool> UpdateMyProfileAsync(int userId, EditMyProfileVM vm, string? avatarPath)
        {
            try
            {
                var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.AccountId == userId);
                if (profile == null)
                    throw new Exception("Không tìm thấy hồ sơ người dùng.");

                string TrimOrThrow(string input, string field)
                {
                    var trimmed = input?.Trim();
                    if (string.IsNullOrWhiteSpace(trimmed))
                        throw new Exception($"{field} không được chỉ chứa khoảng trắng.");
                    return trimmed;
                }
                 
                profile.Name = TrimOrThrow(vm.Name, "Tên");
                profile.Address = TrimOrThrow(vm.Address, "Địa chỉ");
                profile.Dob = vm.Dob;
                profile.Sex = vm.Sex;
                profile.Phone = TrimOrThrow(vm.Phone, "Số điện thoại");

                if (!string.IsNullOrEmpty(avatarPath))
                    profile.Avatar = avatarPath;

                profile.UpdatedDate = DateOnly.FromDateTime(DateTime.Now);

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                throw new Exception($"Lỗi khi cập nhật hồ sơ: {ex.Message}");
            }
        }

    }
}
