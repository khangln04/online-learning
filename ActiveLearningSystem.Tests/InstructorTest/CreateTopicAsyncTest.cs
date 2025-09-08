using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ActiveLearningSystem.Model;
using ActiveLearningSystem.Services.InstructorServices;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace ActiveLearningSystem.Tests.InstructorTest
{
    public class CreateTopicAsyncTest
    {
        private ManageTopicService BuildService(string dbName, out AlsContext ctx)
        {
            var options = new DbContextOptionsBuilder<AlsContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;

            ctx = new AlsContext(options);

            var mapperMock = new Mock<IMapper>();
            mapperMock
                .Setup(m => m.Map<Topic>(It.IsAny<TopicCreateUpdateVM>()))
                .Returns<TopicCreateUpdateVM>(vm => new Topic
                {
                    Name = vm.Name,
                    CategoryId = vm.CategoryId,
                    ClassId = vm.ClassId
                });

            return new ManageTopicService(ctx, mapperMock.Object);
        }

        [Fact(DisplayName = "UTCID01 - Tạo topic thành công với dữ liệu hợp lệ")]
        public async Task UTCID01_ValidData_ReturnsSuccess()
        {
            var service = BuildService(nameof(UTCID01_ValidData_ReturnsSuccess), out var context);

            context.Categories.Add(new Category { Id = 1, Name = "Khoa học" });
            context.Classes.Add(new Class { Id = 1, Name = "10A1" });
            await context.SaveChangesAsync();

            var req = new TopicCreateUpdateVM
            {
                Name = "Vật lý hạt nhân",
                CategoryId = 1,
                ClassId = 1
            };

            await service.CreateTopicAsync(req);

            var saved = context.Topics.FirstOrDefault();
            Assert.NotNull(saved);
            Assert.Equal("Vật lý hạt nhân", saved.Name);
            Assert.Equal(1, saved.CategoryId);
            Assert.Equal(1, saved.ClassId);
        }

        [Theory(DisplayName = "UTCID02 - Validate tên topic không hợp lệ")]
        [InlineData(null, "❌ Lỗi: Tên topic là bắt buộc và không được để trống.")]
        [InlineData("", "❌ Lỗi: Tên topic là bắt buộc và không được để trống.")]
        [InlineData("   ", "❌ Lỗi: Tên topic là bắt buộc và không được để trống.")]
        [InlineData("Tên topic quá dài vượt quá 100 ký tự Tên topic quá dài vượt quá 100 ký tự Tên topic quá dài vượt quá 100 ký tự",
            "❌ Lỗi: Tên topic không được vượt quá 100 ký tự.")]
        public async Task UTCID02_InvalidName_ThrowsException(string name, string expectedLog)
        {
            var service = BuildService(nameof(UTCID02_InvalidName_ThrowsException) + Guid.NewGuid(), out var context);

            context.Categories.Add(new Category { Id = 1, Name = "Khoa học" });
            context.Classes.Add(new Class { Id = 1, Name = "10A1" });
            await context.SaveChangesAsync();

            var req = new TopicCreateUpdateVM { Name = name, CategoryId = 1, ClassId = 1 };

            var originalOut = Console.Out;
            using var sw = new StringWriter();
            Console.SetOut(sw);

            try
            {
                await Assert.ThrowsAsync<ArgumentException>(() => service.CreateTopicAsync(req));

                var log = sw.ToString();
                Assert.Contains(expectedLog, log);
                Assert.False(context.Topics.Any());
            }
            finally
            {
                Console.SetOut(originalOut);
            }
        }

        [Fact(DisplayName = "UTCID03 - Trùng tên topic")]
        public async Task UTCID03_DuplicateName_ThrowsException()
        {
            var service = BuildService(nameof(UTCID03_DuplicateName_ThrowsException), out var context);

            context.Categories.Add(new Category { Id = 1, Name = "Khoa học" });
            context.Classes.Add(new Class { Id = 1, Name = "10A1" });
            context.Topics.Add(new Topic { Id = 100, Name = "Hoá hữu cơ", CategoryId = 1, ClassId = 1 });
            await context.SaveChangesAsync();

            var req = new TopicCreateUpdateVM { Name = "Hoá hữu cơ", CategoryId = 1, ClassId = 1 };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateTopicAsync(req));
            Assert.Equal("Tên topic đã tồn tại.", ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Category không tồn tại")]
        public async Task UTCID04_CategoryNotFound_ThrowsException()
        {
            var service = BuildService(nameof(UTCID04_CategoryNotFound_ThrowsException), out var context);

            context.Classes.Add(new Class { Id = 1, Name = "10A1" });
            await context.SaveChangesAsync();

            var req = new TopicCreateUpdateVM { Name = "Hoá hữu cơ", CategoryId = 999, ClassId = 1 };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateTopicAsync(req));
            Assert.Equal("Category không tồn tại.", ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Class không tồn tại")]
        public async Task UTCID05_ClassNotFound_ThrowsException()
        {
            var service = BuildService(nameof(UTCID05_ClassNotFound_ThrowsException), out var context);

            context.Categories.Add(new Category { Id = 1, Name = "Khoa học" });
            await context.SaveChangesAsync();

            var req = new TopicCreateUpdateVM { Name = "Hoá hữu cơ", CategoryId = 1, ClassId = 999 };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateTopicAsync(req));
            Assert.Equal("Class không tồn tại.", ex.Message);
        }

        [Fact(DisplayName = "UTCID06 - Trim tên topic trước khi lưu")]
        public async Task UTCID06_TrimmedName_BeforeSave()
        {
            var service = BuildService(nameof(UTCID06_TrimmedName_BeforeSave), out var context);

            context.Categories.Add(new Category { Id = 1, Name = "Khoa học" });
            context.Classes.Add(new Class { Id = 1, Name = "10A1" });
            await context.SaveChangesAsync();

            var req = new TopicCreateUpdateVM { Name = "   Hoá hữu cơ   ", CategoryId = 1, ClassId = 1 };

            await service.CreateTopicAsync(req);

            var saved = context.Topics.FirstOrDefault();
            Assert.NotNull(saved);
            Assert.Equal("Hoá hữu cơ", saved.Name);
        }

        [Fact(DisplayName = "UTCID07 - Biên giới tên 100 ký tự hợp lệ")]
        public async Task UTCID07_Boundary100Chars_Pass()
        {
            var service = BuildService(nameof(UTCID07_Boundary100Chars_Pass), out var context);

            context.Categories.Add(new Category { Id = 1, Name = "Khoa học" });
            context.Classes.Add(new Class { Id = 1, Name = "10A1" });
            await context.SaveChangesAsync();

            var name100 = new string('A', 100);
            var req = new TopicCreateUpdateVM { Name = name100, CategoryId = 1, ClassId = 1 };

            await service.CreateTopicAsync(req);

            var saved = context.Topics.FirstOrDefault();
            Assert.NotNull(saved);
            Assert.Equal(100, saved.Name.Length);
        }
    }
}
