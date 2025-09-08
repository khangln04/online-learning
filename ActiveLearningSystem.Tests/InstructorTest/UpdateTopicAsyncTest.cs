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
    public class UpdateTopicAsyncTest
    {
        private ManageTopicService BuildService(string dbName, out AlsContext ctx)
        {
            var options = new DbContextOptionsBuilder<AlsContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;

            ctx = new AlsContext(options);

            var mapperMock = new Mock<IMapper>();
            mapperMock
                .Setup(m => m.Map(It.IsAny<TopicCreateUpdateVM>(), It.IsAny<Topic>()))
                .Callback<TopicCreateUpdateVM, Topic>((vm, entity) =>
                {
                    entity.Name = vm.Name;
                    entity.CategoryId = vm.CategoryId;
                    entity.ClassId = vm.ClassId;
                });

            return new ManageTopicService(ctx, mapperMock.Object);
        }

        [Fact(DisplayName = "UTCID01 - Cập nhật thành công với dữ liệu hợp lệ")]
        public async Task UTCID01_ValidData_ReturnsTrue()
        {
            var service = BuildService(nameof(UTCID01_ValidData_ReturnsTrue), out var context);

            context.Categories.Add(new Category { Id = 1, Name = "Khoa học" });
            context.Classes.Add(new Class { Id = 1, Name = "10A1" });
            context.Topics.Add(new Topic { Id = 100, Name = "Cũ", CategoryId = 1, ClassId = 1 });
            await context.SaveChangesAsync();

            var req = new TopicCreateUpdateVM { Name = "Vật lý", CategoryId = 1, ClassId = 1 };

            var result = await service.UpdateTopicAsync(100, req);

            Assert.True(result);
            var updated = context.Topics.First(t => t.Id == 100);
            Assert.Equal("Vật lý", updated.Name);
        }

        [Theory(DisplayName = "UTCID02 - Validate tên topic không hợp lệ")]
        [InlineData(null, "❌ Lỗi: Tên topic không được để trống.")]
        [InlineData("", "❌ Lỗi: Tên topic không được để trống.")]
        [InlineData("   ", "❌ Lỗi: Tên topic không được để trống.")]
        [InlineData("Tên topic quá dài vượt quá 100 ký tự Tên topic quá dài vượt quá 100 ký tự Tên topic quá dài vượt quá 100 ký tự",
            "❌ Lỗi: Tên topic không được vượt quá 100 ký tự.")]
        public async Task UTCID02_InvalidName_ReturnsFalse(string name, string expectedLog)
        {
            var service = BuildService(nameof(UTCID02_InvalidName_ReturnsFalse) + Guid.NewGuid(), out var context);

            context.Categories.Add(new Category { Id = 1, Name = "Khoa học" });
            context.Classes.Add(new Class { Id = 1, Name = "10A1" });
            context.Topics.Add(new Topic { Id = 200, Name = "Cũ", CategoryId = 1, ClassId = 1 });
            await context.SaveChangesAsync();

            var req = new TopicCreateUpdateVM { Name = name, CategoryId = 1, ClassId = 1 };

            var originalOut = Console.Out;
            using var sw = new StringWriter();
            Console.SetOut(sw);

            try
            {
                var result = await service.UpdateTopicAsync(200, req);

                Assert.False(result);
                var log = sw.ToString();
                Assert.Contains(expectedLog, log);

                // dữ liệu không bị đổi
                var unchanged = context.Topics.First(t => t.Id == 200);
                Assert.Equal("Cũ", unchanged.Name);
            }
            finally
            {
                Console.SetOut(originalOut);
            }
        }

        [Fact(DisplayName = "UTCID03 - Trùng tên với topic khác")]
        public async Task UTCID03_DuplicateName_ThrowsException()
        {
            var service = BuildService(nameof(UTCID03_DuplicateName_ThrowsException), out var context);

            context.Categories.Add(new Category { Id = 1, Name = "Khoa học" });
            context.Classes.Add(new Class { Id = 1, Name = "10A1" });
            context.Topics.Add(new Topic { Id = 1, Name = "Toán", CategoryId = 1, ClassId = 1 });
            context.Topics.Add(new Topic { Id = 2, Name = "Lý", CategoryId = 1, ClassId = 1 });
            await context.SaveChangesAsync();

            var req = new TopicCreateUpdateVM { Name = "Toán", CategoryId = 1, ClassId = 1 };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.UpdateTopicAsync(2, req));
            Assert.Equal("Tên topic đã tồn tại.", ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Category không tồn tại")]
        public async Task UTCID04_CategoryNotFound_ThrowsException()
        {
            var service = BuildService(nameof(UTCID04_CategoryNotFound_ThrowsException), out var context);

            context.Classes.Add(new Class { Id = 1, Name = "10A1" });
            context.Topics.Add(new Topic { Id = 1, Name = "Toán", CategoryId = 999, ClassId = 1 });
            await context.SaveChangesAsync();

            var req = new TopicCreateUpdateVM { Name = "Toán", CategoryId = 123, ClassId = 1 };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.UpdateTopicAsync(1, req));
            Assert.Equal("Category không tồn tại.", ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Class không tồn tại")]
        public async Task UTCID05_ClassNotFound_ThrowsException()
        {
            var service = BuildService(nameof(UTCID05_ClassNotFound_ThrowsException), out var context);

            context.Categories.Add(new Category { Id = 1, Name = "Khoa học" });
            context.Topics.Add(new Topic { Id = 1, Name = "Toán", CategoryId = 1, ClassId = 999 });
            await context.SaveChangesAsync();

            var req = new TopicCreateUpdateVM { Name = "Toán", CategoryId = 1, ClassId = 123 };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.UpdateTopicAsync(1, req));
            Assert.Equal("Class không tồn tại.", ex.Message);
        }

        [Fact(DisplayName = "UTCID06 - Không tìm thấy topic")]
        public async Task UTCID06_TopicNotFound_ReturnsFalse()
        {
            var service = BuildService(nameof(UTCID06_TopicNotFound_ReturnsFalse), out var context);

            context.Categories.Add(new Category { Id = 1, Name = "Khoa học" });
            context.Classes.Add(new Class { Id = 1, Name = "10A1" });
            await context.SaveChangesAsync();

            var req = new TopicCreateUpdateVM { Name = "Sinh học", CategoryId = 1, ClassId = 1 };

            var result = await service.UpdateTopicAsync(999, req);
            Assert.False(result);
        }

        [Fact(DisplayName = "UTCID07 - Trim tên trước khi lưu")]
        public async Task UTCID07_TrimmedName_BeforeSave()
        {
            var service = BuildService(nameof(UTCID07_TrimmedName_BeforeSave), out var context);

            context.Categories.Add(new Category { Id = 1, Name = "Khoa học" });
            context.Classes.Add(new Class { Id = 1, Name = "10A1" });
            context.Topics.Add(new Topic { Id = 1, Name = "Cũ", CategoryId = 1, ClassId = 1 });
            await context.SaveChangesAsync();

            var req = new TopicCreateUpdateVM { Name = "   Sinh học   ", CategoryId = 1, ClassId = 1 };

            var result = await service.UpdateTopicAsync(1, req);

            Assert.True(result);
            var updated = context.Topics.First(t => t.Id == 1);
            Assert.Equal("Sinh học", updated.Name);
        }

        [Fact(DisplayName = "UTCID08 - Biên giới tên 100 ký tự hợp lệ")]
        public async Task UTCID08_Boundary100Chars_Pass()
        {
            var service = BuildService(nameof(UTCID08_Boundary100Chars_Pass), out var context);

            context.Categories.Add(new Category { Id = 1, Name = "Khoa học" });
            context.Classes.Add(new Class { Id = 1, Name = "10A1" });
            context.Topics.Add(new Topic { Id = 1, Name = "Cũ", CategoryId = 1, ClassId = 1 });
            await context.SaveChangesAsync();

            var name100 = new string('A', 100);
            var req = new TopicCreateUpdateVM { Name = name100, CategoryId = 1, ClassId = 1 };

            var result = await service.UpdateTopicAsync(1, req);

            Assert.True(result);
            var updated = context.Topics.First(t => t.Id == 1);
            Assert.Equal(100, updated.Name.Length);
        }
    }
}
