using ActiveLearningSystem.Hubs;
using ActiveLearningSystem.Model;
using ActiveLearningSystem.Services.MailService;
using ActiveLearningSystem.Services.MarketerServices;
using ActiveLearningSystem.ViewModel.MaketerViewModels;
using AutoMapper;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace ActiveLearningSystem.Tests.UnitTest.ReportService_UnitTest
{
    public class CreateReportAsyncTest
    {
        private readonly ReportService _service;
        private readonly AlsContext _context;

        public CreateReportAsyncTest()
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
        }

        [Theory(DisplayName = "UTCID01 - Validate required fields")]
        [InlineData("", "Manager A", "Nội dung", "❌ Tiêu đề báo cáo là bắt buộc.")]
        [InlineData("Tiêu đề", "   ", "Nội dung", "❌ Người nhận là bắt buộc và không được phép chỉ chứa khoảng trắng.")]
        [InlineData("Tiêu đề", "Manager A", "", "❌ Nội dung báo cáo là bắt buộc.")]
        public async Task UTCID01_RequiredFields_ReturnsFalse(string title, string receiver, string content, string expectedMessage)
        {
            // Arrange
            var vm = new CreateReportVM
            {
                Title = title,
                ReceiverName = receiver,
                ContentDetail = content,
                Files = new List<IFormFile>() // giả lập file rỗng
            };

            // Act
            var result = await _service.CreateReportAsync(vm, 1);

            // Assert
            Assert.False(result);
        }

        [Theory(DisplayName = "UTCID02 - Validate max length")]
        [InlineData("x", 201, "❌ Tiêu đề báo cáo không được vượt quá 200 ký tự.")]
        [InlineData("Receiver", 101, "❌ Tên người nhận không được vượt quá 100 ký tự.")]
        [InlineData("Content", 501, "❌ Nội dung báo cáo không được vượt quá 500 ký tự.")]
        public async Task UTCID02_MaxLength_ReturnsFalse(string field, int length, string expectedMessage)
        {
            // Arrange
            var vm = new CreateReportVM
            {
                Title = field == "x" ? new string('A', length) : "Tiêu đề hợp lệ",
                ReceiverName = field == "Receiver" ? new string('B', length) : "Nguyen Van A",
                ContentDetail = field == "Content" ? new string('C', length) : "Nội dung hợp lệ",
                Files = new List<IFormFile>() // giả lập file rỗng
            };

            // Act
            var result = await _service.CreateReportAsync(vm, 1);

            // Assert
            Assert.False(result);
        }

        [Fact(DisplayName = "UTCID03 - Missing files")]
        public async Task UTCID03_MissingFiles_ReturnsFalse()
        {
            var vm = new CreateReportVM
            {
                Title = "Tiêu đề",
                ReceiverName = "Manager A",
                ContentDetail = "Nội dung",
                Files = new List<IFormFile>() // rỗng
            };

            var result = await _service.CreateReportAsync(vm, 1);

            Assert.False(result);
        }
    }
}
