using System; // ✅ để dùng DateOnly
using ActiveLearningSystem.Hubs;
using ActiveLearningSystem.Model;
using ActiveLearningSystem.Services.MailService;
using ActiveLearningSystem.Services.MarketerServices;
using ActiveLearningSystem.ViewModel.MaketerViewModels;
using AutoMapper;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using DbProfile = ActiveLearningSystem.Model.Profile; // ✅ Alias tránh đụng AutoMapper.Profile

namespace ActiveLearningSystem.Tests.UnitTest.ReportService_UnitTest
{
    public class UpdateReportStatusAsyncTest
    {
        private readonly ReportService _service;
        private readonly AlsContext _context;

        public UpdateReportStatusAsyncTest()
        {
            // InMemory DbContext
            var options = new DbContextOptionsBuilder<AlsContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new AlsContext(options);

            var mapper = new Mock<IMapper>();
            var env = new Mock<IWebHostEnvironment>();
            env.Setup(e => e.WebRootPath).Returns("wwwroot");

            var mailService = new Mock<IMailService>();
            var hubContext = new Mock<IHubContext<NotificationHub>>();

            _service = new ReportService(_context, mapper.Object, env.Object, mailService.Object, hubContext.Object);

            SeedStaticData();
        }

        private void SeedStaticData()
        {
            // Roles
            _context.Roles.AddRange(
                new Role { Id = 2, Name = "Manager" },
                new Role { Id = 5, Name = "Instructor" },
                new Role { Id = 3, Name = "Marketer" }
            );

            // Report Statuses (1..7)
            _context.ReportStatuses.AddRange(
                new ReportStatus { Id = 1, Name = "Summit" },
                new ReportStatus { Id = 2, Name = "Reject" },
                new ReportStatus { Id = 3, Name = "Approve" },
                new ReportStatus { Id = 4, Name = "Process" },
                new ReportStatus { Id = 5, Name = "Created" },
                new ReportStatus { Id = 6, Name = "Reviewing" },
                new ReportStatus { Id = 7, Name = "Done" }
            );

            // Profiles (gán đầy đủ thuộc tính required: Address, Phone, Dob, Sex, Email, Name, AccountId, RoleId)
            var today = DateOnly.FromDateTime(DateTime.Today);
            _context.Profiles.AddRange(
                new DbProfile
                {
                    UserId = 1001,
                    AccountId = 101,
                    RoleId = 2, // Manager
                    Name = "Manager A",
                    Address = "1 Test Street",
                    Phone = "0900000001",
                    Email = "manager@test.com",
                    Dob = today,
                    Sex = true
                },
                new DbProfile
                {
                    UserId = 1002,
                    AccountId = 102,
                    RoleId = 5, // Instructor
                    Name = "Instructor A",
                    Address = "2 Test Street",
                    Phone = "0900000002",
                    Email = "instructor@test.com",
                    Dob = today,
                    Sex = true
                },
                new DbProfile
                {
                    UserId = 1003,
                    AccountId = 103,
                    RoleId = 3, // Marketer
                    Name = "Marketer A",
                    Address = "3 Test Street",
                    Phone = "0900000003",
                    Email = "marketer@test.com",
                    Dob = today,
                    Sex = false
                }
            );

            _context.SaveChanges();
        }

        private int CreateReport(int statusId, int? instructorId = null)
        {
            var report = new Report
            {
                Title = "Báo cáo test",
                UserId = 1003,         // Marketer
                ReceiverId = 1001,     // Manager
                InstructorId = instructorId,
                StatusId = statusId,
                CreatedDate = DateTime.Now,
                IsDeleted = false
            };
            _context.Reports.Add(report);
            _context.SaveChanges();
            return report.Id;
        }

        [Fact(DisplayName = "UTCID01 - Manager chuyển từ 1 -> 2 (reject) thành công")]
        public async Task UTCID01_Manager_1_To_2_Success()
        {
            var reportId = CreateReport(1);
            var vm = new UpdateStatusVM { NewStatusId = 2 };

            var result = await _service.UpdateReportStatusAsync(reportId, vm, 101);

            Assert.True(result.Success);
            Assert.Equal("Reject", result.NewStatusName);
            var report = await _context.Reports.FindAsync(reportId);
            Assert.Equal(2, report!.StatusId);
        }

        [Fact(DisplayName = "UTCID02 - Manager 1 -> 3 thiếu instructorId phải lỗi")]
        public async Task UTCID02_Manager_1_To_3_RequireInstructorId()
        {
            var reportId = CreateReport(1);
            var vm = new UpdateStatusVM { NewStatusId = 3 };

            await Assert.ThrowsAsync<Exception>(() => _service.UpdateReportStatusAsync(reportId, vm, 101));
        }

        [Fact(DisplayName = "UTCID03 - Manager 1 -> 3 có instructorId thành công và gán Instructor")]
        public async Task UTCID03_Manager_1_To_3_WithInstructor_Success()
        {
            var reportId = CreateReport(1);
            var vm = new UpdateStatusVM { NewStatusId = 3, InstructorId = 1002 };

            var result = await _service.UpdateReportStatusAsync(reportId, vm, 101);

            Assert.True(result.Success);
            Assert.Equal("Approve", result.NewStatusName);
            var report = await _context.Reports.FindAsync(reportId);
            Assert.Equal(3, report!.StatusId);
            Assert.Equal(1002, report.InstructorId);
        }

        [Fact(DisplayName = "UTCID04 - Instructor 3 -> 4 (process) thành công")]
        public async Task UTCID04_Instructor_3_To_4_Success()
        {
            var reportId = CreateReport(3, instructorId: 1002);
            var vm = new UpdateStatusVM { NewStatusId = 4 };

            var result = await _service.UpdateReportStatusAsync(reportId, vm, 102);

            Assert.True(result.Success);
            Assert.Equal("Process", result.NewStatusName);
            var report = await _context.Reports.FindAsync(reportId);
            Assert.Equal(4, report!.StatusId);
        }

        [Fact(DisplayName = "UTCID05 - Instructor 4 -> 5 (created) thành công")]
        public async Task UTCID05_Instructor_4_To_5_Success()
        {
            var reportId = CreateReport(4, instructorId: 1002);
            var vm = new UpdateStatusVM { NewStatusId = 5 };

            var result = await _service.UpdateReportStatusAsync(reportId, vm, 102);

            Assert.True(result.Success);
            Assert.Equal("Created", result.NewStatusName);
            var report = await _context.Reports.FindAsync(reportId);
            Assert.Equal(5, report!.StatusId);
        }

        [Fact(DisplayName = "UTCID06 - Marketer 5 -> 6 (reviewing) thành công")]
        public async Task UTCID06_Marketer_5_To_6_Success()
        {
            var reportId = CreateReport(5, instructorId: 1002);
            var vm = new UpdateStatusVM { NewStatusId = 6 };

            var result = await _service.UpdateReportStatusAsync(reportId, vm, 103);

            Assert.True(result.Success);
            Assert.Equal("Reviewing", result.NewStatusName);
            var report = await _context.Reports.FindAsync(reportId);
            Assert.Equal(6, report!.StatusId);
        }

        [Fact(DisplayName = "UTCID07 - Marketer 6 -> 7 (done) thành công")]
        public async Task UTCID07_Marketer_6_To_7_Success()
        {
            var reportId = CreateReport(6, instructorId: 1002);
            var vm = new UpdateStatusVM { NewStatusId = 7 };

            var result = await _service.UpdateReportStatusAsync(reportId, vm, 103);

            Assert.True(result.Success);
            Assert.Equal("Done", result.NewStatusName);
            var report = await _context.Reports.FindAsync(reportId);
            Assert.Equal(7, report!.StatusId);
        }

        [Fact(DisplayName = "UTCID08 - Marketer cố chuyển 1 -> 2 phải lỗi (không có quyền)")]
        public async Task UTCID08_Marketer_1_To_2_Invalid()
        {
            var reportId = CreateReport(1);
            var vm = new UpdateStatusVM { NewStatusId = 2 };

            await Assert.ThrowsAsync<Exception>(() => _service.UpdateReportStatusAsync(reportId, vm, 103));
        }

        [Fact(DisplayName = "UTCID09 - newStatusId ngoài [1..7] (0) phải lỗi")]
        public async Task UTCID09_Status_OutOfRange_Low()
        {
            var reportId = CreateReport(1);
            var vm = new UpdateStatusVM { NewStatusId = 0 };

            await Assert.ThrowsAsync<Exception>(() => _service.UpdateReportStatusAsync(reportId, vm, 101));
        }

        [Fact(DisplayName = "UTCID10 - newStatusId ngoài [1..7] (8) phải lỗi")]
        public async Task UTCID10_Status_OutOfRange_High()
        {
            var reportId = CreateReport(1);
            var vm = new UpdateStatusVM { NewStatusId = 8 };

            await Assert.ThrowsAsync<Exception>(() => _service.UpdateReportStatusAsync(reportId, vm, 101));
        }

        [Fact(DisplayName = "UTCID11 - reportId <= 0 phải lỗi")]
        public async Task UTCID11_ReportId_Invalid()
        {
            var vm = new UpdateStatusVM { NewStatusId = 2 };
            await Assert.ThrowsAsync<Exception>(() => _service.UpdateReportStatusAsync(0, vm, 101));
        }

        [Fact(DisplayName = "UTCID12 - Báo cáo không tồn tại phải lỗi")]
        public async Task UTCID12_Report_NotFound()
        {
            var vm = new UpdateStatusVM { NewStatusId = 2 };
            await Assert.ThrowsAsync<Exception>(() => _service.UpdateReportStatusAsync(999999, vm, 101));
        }
    }
}
