using ActiveLearningSystem.Hubs;
using ActiveLearningSystem.Model;
using ActiveLearningSystem.Services.MailService;
using ActiveLearningSystem.ViewModel.MaketerViewModels;
using AutoMapper;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.IO.Compression;

namespace ActiveLearningSystem.Services.MarketerServices
{
    public class ReportService : IReportService
    {
        private readonly AlsContext _context;
        private readonly IMapper _mapper;
        private readonly IWebHostEnvironment _env;
        private readonly IMailService _mailService;
        private readonly IHubContext<NotificationHub> _hubContext;

        public ReportService(AlsContext context, IMapper mapper, IWebHostEnvironment env, IMailService mailService, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _mapper = mapper;
            _env = env;
            _mailService = mailService;
            _hubContext = hubContext;
        }

        public async Task<(bool Success, string Message)> CreateReportAsync(CreateReportVM vm, int userId)
        {
            try
            {
                // Trim ReceiverName trước khi xử lý
                vm.ReceiverName = vm.ReceiverName?.Trim();

                // Validate Title
                if (string.IsNullOrWhiteSpace(vm.Title))
                    return (false, "❌ Tiêu đề báo cáo là bắt buộc.");
                if (vm.Title.Length > 200)
                    return (false, "❌ Tiêu đề báo cáo không được vượt quá 200 ký tự.");

                // Validate ReceiverName
                if (string.IsNullOrWhiteSpace(vm.ReceiverName))
                    return (false, "❌ Người nhận là bắt buộc và không được chỉ chứa khoảng trắng.");
                if (vm.ReceiverName.Length > 100)
                    return (false, "❌ Tên người nhận không được vượt quá 100 ký tự.");

                // Validate ContentDetail
                if (string.IsNullOrWhiteSpace(vm.ContentDetail))
                    return (false, "❌ Nội dung báo cáo là bắt buộc.");
                if (vm.ContentDetail.Length > 500)
                    return (false, "❌ Nội dung báo cáo không được vượt quá 500 ký tự.");

                // Validate Files
                if (vm.Files == null || !vm.Files.Any())
                    return (false, "❌ Phải có ít nhất một file đính kèm.");

                // Check quyền Marketer
                var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.AccountId == userId);
                if (profile == null || profile.RoleId != 3)
                    return (false, "❌ Người dùng không có quyền tạo báo cáo.");

                // Check Manager người nhận
                var receiver = await _context.Profiles.FirstOrDefaultAsync(p => p.RoleId == 2 && p.Name == vm.ReceiverName);
                if (receiver == null)
                    return (false, "❌ Manager không tồn tại.");

                // Tạo Report
                var report = new Report
                {
                    Title = vm.Title,
                    UserId = profile.UserId,
                    ReceiverId = receiver.UserId,
                    ContentDetail = vm.ContentDetail,
                    StatusId = 1, // summit
                    CreatedDate = DateTime.Now,
                    IsDeleted = false
                };

                _context.Reports.Add(report);
                await _context.SaveChangesAsync();

                // Tạo folder lưu file
                var uploadFolder = Path.Combine(_env.WebRootPath ?? "wwwroot", "UploadFile");
                var reportFolder = Path.Combine(uploadFolder, $"Report_{report.Id}");
                Directory.CreateDirectory(reportFolder);

                foreach (var file in vm.Files)
                {
                    var safeFileName = $"{Guid.NewGuid()}__{file.FileName}";
                    var path = Path.Combine(reportFolder, safeFileName);
                    using (var stream = new FileStream(path, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    var reportFile = new ReportFile
                    {
                        ReportId = report.Id,
                        FilePath = $"/UploadFile/Report_{report.Id}/{safeFileName}",
                        UploadedAt = DateTime.Now
                    };
                    _context.ReportFiles.Add(reportFile);
                }

                await _context.SaveChangesAsync();

                // 🚀 Gửi mail thông báo đến người tạo và người nhận
                var creator = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == report.UserId);
                var receiverProfile = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == report.ReceiverId);

                var subject = $"📢 Báo cáo mới #{report.Id} đã được tạo";
                var recipients = new List<string>();
                if (!string.IsNullOrEmpty(creator?.Email)) recipients.Add(creator.Email);
                if (!string.IsNullOrEmpty(receiverProfile?.Email)) recipients.Add(receiverProfile.Email);

                foreach (var recipient in recipients)
                {
                    var recipientProfile = await _context.Profiles.FirstOrDefaultAsync(p => p.Email == recipient);
                    var recipientRole = recipientProfile != null
                        ? await _context.Roles.Where(r => r.Id == recipientProfile.RoleId).Select(r => r.Name).FirstOrDefaultAsync()
                        : "Unknown";

                    var body = $@"
                <!DOCTYPE html>
                <html lang='vi'>
                <head>
                    <meta charset='UTF-8'>
                    <style>
                        body {{ font-family: Arial, Helvetica, sans-serif; background-color: #f4f6f9; padding: 20px; color: #333; }}
                        .container {{ max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; 
                                     box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 25px; }}
                        h2 {{ color: #2c7be5; text-align: center; margin-bottom: 20px; }}
                        .info p {{ margin: 8px 0; font-size: 14px; }}
                        .footer {{ margin-top: 25px; text-align: center; font-size: 12px; color: #888; }}
                        .btn {{ display: inline-block; padding: 10px 20px; background-color: #2c7be5; 
                               color: #fff !important; text-decoration: none; border-radius: 8px; font-size: 14px; margin-top: 15px; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <h2>📑 Báo cáo {report.Title} đã được tạo</h2>
                        <div class='info'>
                            <p><b>Tiêu đề:</b> {report.Title}</p>
                            <p><b>Người tạo:</b> {creator?.Name}</p>
                            <p><b>Người nhận:</b> {receiverProfile?.Name}</p>
                            <p><b>Thời gian:</b> {DateTime.Now:dd/MM/yyyy HH:mm:ss}</p>
                        </div>
                        <div style='text-align:center;'>
                            <a class='btn' href='https://localhost:3000/report-detail/{report.Id}?role={recipientRole}'>
                                Xem chi tiết báo cáo
                            </a>
                        </div>
                        <div class='footer'>
                            Email này được gửi tự động từ hệ thống Active Learning System.<br/>
                            Vui lòng không trả lời lại email này.
                        </div>
                    </div>
                </body>
                </html>";

                    await _mailService.SendEmailAsync(recipient, subject, body);
                }

                return (true, "✅ Tạo báo cáo thành công và đã gửi thông báo email.");
            }
            catch (Exception ex)
            {
                return (false, $"❌ Lỗi hệ thống: {ex.Message}");
            }
        }

        public async Task<List<ManagerDropdownVM>> GetAllManagersAsync()
        {
            const int MANAGER_ROLE_ID = 2;
            return await _context.Profiles
                .Where(p => p.RoleId == MANAGER_ROLE_ID)
                .Select(p => new ManagerDropdownVM
                {
                    Id = p.UserId,
                    FullName = p.Name,
                    Email = p.Email
                })
                .ToListAsync();
        }

        public async Task<List<ManagerDropdownVM>> GetAllInstructorsAsync()
        {
            const int INSTRUCTOR_ROLE_ID = 5;
            var instructors = await _context.Profiles
                .Where(p => p.RoleId == INSTRUCTOR_ROLE_ID)
                .Select(p => new ManagerDropdownVM
                {
                    Id = p.UserId,
                    FullName = p.Name,
                    Email = p.Email
                })
                .ToListAsync();
            return instructors;
        }

        public async Task<List<ReportListItemVM>> GetMyReportsAsync(int accountId)
        {
            var profile = await _context.Profiles
                .FirstOrDefaultAsync(p => p.AccountId == accountId);
            if (profile == null)
                return new List<ReportListItemVM>();
            var userId = profile.UserId;
            var role = await _context.Roles
                .Where(r => r.Id == profile.RoleId)
                .Select(r => r.Name)
                .FirstOrDefaultAsync();
            var query = _context.Reports
                .Include(r => r.User)
                .Include(r => r.Instructor)
                .Include(r => r.ReportFiles)
                .Include(r => r.ReportComments)
                .Include(r => r.Status)
                .AsQueryable();
            if (role == "Marketer")
                query = query.Where(r => r.UserId == userId);
            else if (role == "Manager")
                query = query.Where(r => r.ReceiverId == userId);
            else if (role == "Instructor")
                query = query.Where(r => r.InstructorId == userId);
            var reports = await query
                .OrderByDescending(r => r.CreatedDate) // Sắp xếp theo CreatedDate từ mới nhất đến cũ nhất
                .ThenByDescending(r => r.Id)            // nếu cùng ngày, Id lớn hơn trước
                .Select(r => new ReportListItemVM
                {
                    Id = r.Id,
                    Title = r.Title,
                    CreatedDate = r.CreatedDate,
                    UserName = r.User.Name,
                    ContentDetail = r.ContentDetail ?? string.Empty,
                    FileCount = r.ReportFiles.Count(),
                    CommentCount = r.ReportComments.Any() ? r.ReportComments.Count() : null,
                    InstructorName = r.Instructor != null ? r.Instructor.Name : null,
                    StatusName = r.Status.Name
                })
                .ToListAsync();
            return reports;
        }

        public async Task<ReportDetailVM> GetReportDetailAsync(int reportId, int accountId)
        {
            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.AccountId == accountId);
            if (profile == null) throw new Exception("Không tìm thấy hồ sơ người dùng.");
            var userId = profile.UserId;
            var report = await _context.Reports
                .Include(r => r.User)
                .Include(r => r.Receiver)
                .Include(r => r.Instructor)
                .Include(r => r.ReportFiles)
                .Include(r => r.ReportComments)
                    .ThenInclude(c => c.User)
                        .ThenInclude(u => u.Role)
                .Include(r => r.Status)
                .FirstOrDefaultAsync(r => r.Id == reportId && (r.UserId == userId || r.ReceiverId == userId || r.InstructorId == userId));
            if (report == null) throw new Exception("Báo cáo không tồn tại ");
            var role = await _context.Roles.Where(r => r.Id == profile.RoleId).Select(r => r.Name).FirstOrDefaultAsync();
            var detail = _mapper.Map<ReportDetailVM>(report);
            detail.AvailableInstructors = await GetAllInstructorsAsync();
            detail.ListStatus = await _context.ReportStatuses.Select(s => new ReportStatusVM { Id = s.Id, Name = s.Name }).ToListAsync();
            detail.CanReject = role == "Manager" && report.StatusId == 1; // summit
            detail.CanApprove = role == "Manager" && report.StatusId == 1;
            detail.CanProcess = role == "Instructor" && report.StatusId == 3; // approve
            detail.CanCreate = role == "Instructor" && report.StatusId == 4; // process
            detail.CanReview = role == "Marketer" && report.StatusId == 6; // created
            detail.CanDone = role == "Marketer" && report.StatusId == 7; // reviewing
            detail.CanPublish = role == "Manager" && report.StatusId == 7; // done
            return detail;
        }

        public async Task<(bool Success, string NewStatusName)> UpdateReportStatusAsync(int reportId, UpdateStatusVM vm, int accountId)
        {
            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.AccountId == accountId);
            if (profile == null) throw new Exception("Không tìm thấy hồ sơ người dùng.");
            var userId = profile.UserId;
            var report = await _context.Reports
                .Include(r => r.User)
                .Include(r => r.Receiver)
                .Include(r => r.Instructor)
                .FirstOrDefaultAsync(r => r.Id == reportId && (r.UserId == userId || r.ReceiverId == userId || r.InstructorId == userId));
            if (report == null) throw new Exception("Báo cáo không tồn tại hoặc bạn không có quyền truy cập.");
            var role = await _context.Roles.Where(r => r.Id == profile.RoleId).Select(r => r.Name).FirstOrDefaultAsync();
            var isValidTransition = false;
            switch (role)
            {
                case "Marketer":
                    isValidTransition = (report.StatusId == 5 && vm.NewStatusId == 6) || // created -> reviewing
                                        (report.StatusId == 6 && vm.NewStatusId == 7); // reviewing -> done
                    break;
                case "Manager":
                    isValidTransition = (report.StatusId == 1 && vm.NewStatusId == 2) || // summit -> reject
                                        (report.StatusId == 1 && vm.NewStatusId == 3 && vm.InstructorId.HasValue) || // summit -> approve
                                        (report.StatusId == 7 && vm.NewStatusId == 8); // done -> published (chỉ Manager)
                    if (vm.NewStatusId == 3) report.InstructorId = vm.InstructorId;
                    break;
                case "Instructor":
                    isValidTransition = (report.StatusId == 3 && vm.NewStatusId == 4) || // approve -> process
                                        (report.StatusId == 4 && vm.NewStatusId == 5); // process -> created
                    break;
            }
            if (!isValidTransition) throw new Exception("Chuyển đổi trạng thái không hợp lệ.");
            report.StatusId = vm.NewStatusId;
            report.LastStatusUpdated = DateTime.Now;
            await _context.SaveChangesAsync();
            var newStatusName = await _context.ReportStatuses
                .Where(s => s.Id == vm.NewStatusId)
                .Select(s => s.Name)
                .FirstOrDefaultAsync();
            var recipients = new List<string>();
            if (vm.NewStatusId == 2) // Reject
            {
                recipients.Add(_context.Profiles.FirstOrDefault(p => p.UserId == report.UserId)?.Email ?? "");
                recipients.Add(_context.Profiles.FirstOrDefault(p => p.UserId == report.ReceiverId)?.Email ?? "");
            }
            else // Approve, Process, Created, Reviewing, Done, Published
            {
                recipients.Add(_context.Profiles.FirstOrDefault(p => p.UserId == report.UserId)?.Email ?? ""); // Marketing
                recipients.Add(_context.Profiles.FirstOrDefault(p => p.UserId == report.ReceiverId)?.Email ?? ""); // Manager
                if (report.InstructorId.HasValue)
                    recipients.Add(_context.Profiles.FirstOrDefault(p => p.UserId == report.InstructorId)?.Email ?? ""); // Instructor
            }
            var subject = $"📢 Cập nhật trạng thái báo cáo #{reportId}";
            foreach (var recipient in recipients.Where(r => !string.IsNullOrEmpty(r)))
            {
                // Lấy vai trò của người nhận
                var recipientProfile = await _context.Profiles.FirstOrDefaultAsync(p => p.Email == recipient);
                var recipientRole = recipientProfile != null ? await _context.Roles.Where(r => r.Id == recipientProfile.RoleId).Select(r => r.Name).FirstOrDefaultAsync() : "Unknown";

                // Xây dựng body với đường dẫn động
                var body = $@"
                            <!DOCTYPE html>
                            <html lang='vi'>
                            <head>
                                <meta charset='UTF-8'>
                                <style>
                                    body {{ font-family: Arial, Helvetica, sans-serif; background-color: #f4f6f9; padding: 20px; color: #333; }}
                                    .container {{ max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 25px; }}
                                    h2 {{ color: #2c7be5; text-align: center; margin-bottom: 20px; }}
                                    .status {{ background: #e9f5ff; border-left: 5px solid #2c7be5; padding: 15px; margin: 20px 0; font-size: 16px; font-weight: bold; }}
                                    .info p {{ margin: 8px 0; font-size: 14px; }}
                                    .footer {{ margin-top: 25px; text-align: center; font-size: 12px; color: #888; }}
                                    .btn {{ display: inline-block; padding: 10px 20px; background-color: #2c7be5; color: #fff !important; text-decoration: none; border-radius: 8px; font-size: 14px; margin-top: 15px; }}
                                </style>
                            </head>
                            <body>
                                <div class='container'>
                                    <h2>📑 Báo cáo #{report.Title} đã được cập nhật</h2>
                                    <div class='status'>
                                        Trạng thái mới: <strong>{newStatusName}</strong>
                                    </div>
                                    <div class='info'>
                                        <p><b>⏰ Thời gian:</b> {DateTime.Now:dd/MM/yyyy HH:mm:ss}</p>
                                        <p><b>👤 Người thực hiện:</b> {profile.Name}</p>
                                    </div>
                                    <div style='text-align:center;'>
                                        <a class='btn' href='https://localhost:3000/report-detail/{report.Id}?role={recipientRole}'>
                                            Xem chi tiết báo cáo
                                        </a>
                                    </div>
                                    <div class='footer'>
                                        Email này được gửi tự động từ hệ thống Active Learning System.<br/>
                                        Vui lòng không trả lời lại email này.
                                    </div>
                                </div>
                            </body>
                            </html>";

                await _mailService.SendEmailAsync(recipient, subject, body);
            }

            return (true, newStatusName);
        }

        public async Task<(bool Success, int CommentId)> AddCommentAsync(int reportId, CreateCommentVM vm, int accountId)
        {
            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.AccountId == accountId);
            if (profile == null) throw new Exception("Không tìm thấy hồ sơ người dùng.");
            var userId = profile.UserId;
            var report = await _context.Reports
                .Include(r => r.User)
                .Include(r => r.Receiver)
                .Include(r => r.Instructor)
                .FirstOrDefaultAsync(r => r.Id == reportId && (r.UserId == userId || r.ReceiverId == userId || r.InstructorId == userId));
            if (report == null) throw new Exception("Báo cáo không tồn tại hoặc bạn không có quyền truy cập.");
            var comment = new ReportComment
            {
                ReportId = reportId,
                UserId = userId,
                CommentText = vm.CommentText,
                CreatedAt = DateTime.Now
            };
            _context.ReportComments.Add(comment);
            await _context.SaveChangesAsync();
            var commentId = comment.Id;
            var commentVm = new CommentReportVM
            {
                Id = commentId,
                CommentText = comment.CommentText,
                CreatedAt = (DateTime)comment.CreatedAt,
                UserName = profile.Name,
                RoleName = await _context.Roles.Where(r => r.Id == profile.RoleId).Select(r => r.Name).FirstOrDefaultAsync() ?? "Unknown"
            };
            var relatedUserIds = new[] { report.UserId, report.ReceiverId };
            if (report.InstructorId.HasValue)
                relatedUserIds = relatedUserIds.Append(report.InstructorId.Value).ToArray();
            foreach (var relatedUserId in relatedUserIds)
            {
                await _hubContext.Clients.Group($"User_{relatedUserId}").SendAsync("ReceiveComment", commentVm);
            }
            await _hubContext.Clients.Group($"Report_{reportId}").SendAsync("ReceiveComment", commentVm);
            return (true, commentId);
        }

        public async Task<Stream> DownloadReportFilesAsync(int reportId, int accountId)
        {
            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.AccountId == accountId);
            if (profile == null) throw new Exception("Không tìm thấy hồ sơ người dùng.");

            var report = await _context.Reports.Include(r => r.ReportFiles)
                .FirstOrDefaultAsync(r => r.Id == reportId && (r.UserId == profile.UserId || r.ReceiverId == profile.UserId || r.InstructorId == profile.UserId));
            if (report == null) throw new Exception("Báo cáo không tồn tại hoặc bạn không có quyền truy cập.");
            if (!report.ReportFiles.Any()) throw new Exception("Không có file nào để tải.");

            var uploadFolder = Path.Combine(_env.WebRootPath ?? "wwwroot", "UploadFile");
            var reportFolder = Path.Combine(uploadFolder, $"Report_{reportId}");

            using var memoryStream = new MemoryStream();
            using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
            {
                foreach (var file in report.ReportFiles)
                {
                    var fullPath = Path.Combine(reportFolder, Path.GetFileName(file.FilePath));
                    if (System.IO.File.Exists(fullPath))
                    {
                        // ✅ Tách tên gốc từ "Guid__TênGốc"
                        var originalName = Path.GetFileName(fullPath).Split("__").Last();
                        var entry = archive.CreateEntry(originalName);
                        using var entryStream = entry.Open();
                        using var fileStream = new FileStream(fullPath, FileMode.Open, FileAccess.Read);
                        await fileStream.CopyToAsync(entryStream);
                    }
                }
            }
            memoryStream.Seek(0, SeekOrigin.Begin);
            return new MemoryStream(memoryStream.ToArray());
        }
    }
}