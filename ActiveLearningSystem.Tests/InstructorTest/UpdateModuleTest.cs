using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ActiveLearningSystem.Model;
using ActiveLearningSystem.Services.InstructorServices;
using ActiveLearningSystem.ViewModel.InstructorViewModels;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace ActiveLearningSystem.Tests.InstructorTest
{
    public class UpdateModuleTest
    {
        private ModuleListService BuildService(string dbName, out AlsContext ctx)
        {
            var options = new DbContextOptionsBuilder<AlsContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;

            ctx = new AlsContext(options);

            // Mock IMapper (không cần dùng trong Update nhưng để service khởi tạo đúng constructor)
            var mapperMock = new Mock<IMapper>();
            return new ModuleListService(ctx, mapperMock.Object);
        }

        [Fact(DisplayName = "UTCID01 - Cập nhật module thành công với dữ liệu hợp lệ")]
        public void UTCID01_ValidData_ReturnsTrue()
        {
            var service = BuildService(nameof(UTCID01_ValidData_ReturnsTrue), out var context);

            // Arrange: thêm course + module để update
            context.Courses.Add(new Course { CourseId = 1, CourseName = "Toán", Description = "Môn toán" });
            context.Modules.Add(new Module { Id = 10, CourseId = 1, ModuleName = "Cũ", Description = "Mô tả cũ" });
            context.SaveChanges();

            var req = new UpdateModuleVM
            {
                ModuleName = "Hàm số",
                Description = "Giới thiệu hàm số"
            };

            // Act
            var ok = service.UpdateModule(10, req);

            // Assert
            Assert.True(ok);
            var updated = context.Modules.First(m => m.Id == 10);
            Assert.Equal("Hàm số", updated.ModuleName);
            Assert.Equal("Giới thiệu hàm số", updated.Description);
        }

        [Theory(DisplayName = "UTCID02 - Validate dữ liệu không hợp lệ")]
        [InlineData(null, "Mô tả", "❌ Lỗi: Tên module là bắt buộc và không được để trống.")]
        [InlineData("", "Mô tả", "❌ Lỗi: Tên module là bắt buộc và không được để trống.")]
        [InlineData("   ", "Mô tả", "❌ Lỗi: Tên module là bắt buộc và không được để trống.")]
        [InlineData("Tên module quá dài vượt quá 100 ký tự Tên module quá dài vượt quá 100 ký tự Tên module quá dài vượt quá 100 ký tự",
            "Mô tả", "❌ Lỗi: Tên module không được vượt quá 100 ký tự.")]
        [InlineData("Hàm số", null, "❌ Lỗi: Mô tả là bắt buộc và không được để trống.")]
        [InlineData("Hàm số", "", "❌ Lỗi: Mô tả là bắt buộc và không được để trống.")]
        [InlineData("Hàm số", "   ", "❌ Lỗi: Mô tả là bắt buộc và không được để trống.")]
        public void UTCID02_InvalidData_ReturnsFalse(string moduleName, string description, string expectedLog)
        {
            var service = BuildService(nameof(UTCID02_InvalidData_ReturnsFalse) + Guid.NewGuid(), out var context);

            context.Courses.Add(new Course { CourseId = 2, CourseName = "Văn", Description = "Môn văn" });
            context.Modules.Add(new Module { Id = 20, CourseId = 2, ModuleName = "Cũ", Description = "Mô tả cũ" });
            context.SaveChanges();

            var req = new UpdateModuleVM { ModuleName = moduleName, Description = description };

            var originalOut = Console.Out;
            using var sw = new StringWriter();
            Console.SetOut(sw);

            try
            {
                var ok = service.UpdateModule(20, req);

                Assert.False(ok);
                var log = sw.ToString();
                Assert.Contains(expectedLog, log);

                // Đảm bảo dữ liệu không bị update
                var unchanged = context.Modules.First(m => m.Id == 20);
                Assert.Equal("Cũ", unchanged.ModuleName);
                Assert.Equal("Mô tả cũ", unchanged.Description);
            }
            finally
            {
                Console.SetOut(originalOut);
            }
        }

        [Fact(DisplayName = "UTCID03 - Không tìm thấy module")]
        public void UTCID03_ModuleNotFound_ReturnsFalse()
        {
            var service = BuildService(nameof(UTCID03_ModuleNotFound_ReturnsFalse), out var context);

            context.Courses.Add(new Course { CourseId = 3, CourseName = "Lý", Description = "Môn lý" });
            context.SaveChanges();

            var req = new UpdateModuleVM { ModuleName = "Hàm số", Description = "Giới thiệu" };

            var originalOut = Console.Out;
            using var sw = new StringWriter();
            Console.SetOut(sw);

            try
            {
                var ok = service.UpdateModule(999, req);

                Assert.False(ok);
                var log = sw.ToString();
                Assert.Contains("❌ Lỗi: Không tìm thấy module.", log);
            }
            finally
            {
                Console.SetOut(originalOut);
            }
        }

        [Fact(DisplayName = "UTCID04 - Tự động trim dữ liệu trước khi lưu")]
        public void UTCID04_TrimmedBeforeSave()
        {
            var service = BuildService(nameof(UTCID04_TrimmedBeforeSave), out var context);

            context.Courses.Add(new Course { CourseId = 4, CourseName = "Sinh", Description = "Môn sinh" });
            context.Modules.Add(new Module { Id = 40, CourseId = 4, ModuleName = "Cũ", Description = "Cũ" });
            context.SaveChanges();

            var req = new UpdateModuleVM
            {
                ModuleName = "   Hàm số   ",
                Description = "   Giới thiệu   "
            };

            var ok = service.UpdateModule(40, req);

            Assert.True(ok);
            var updated = context.Modules.First(m => m.Id == 40);
            Assert.Equal("Hàm số", updated.ModuleName);
            Assert.Equal("Giới thiệu", updated.Description);
        }

        [Fact(DisplayName = "UTCID05 - ModuleName đúng biên 100 ký tự thì hợp lệ")]
        public void UTCID05_Boundary100Chars_Pass()
        {
            var service = BuildService(nameof(UTCID05_Boundary100Chars_Pass), out var context);

            context.Courses.Add(new Course { CourseId = 5, CourseName = "Anh", Description = "Môn Anh" });
            context.Modules.Add(new Module { Id = 50, CourseId = 5, ModuleName = "Cũ", Description = "Cũ" });
            context.SaveChanges();

            var name100 = new string('A', 100);
            var req = new UpdateModuleVM { ModuleName = name100, Description = "OK" };

            var ok = service.UpdateModule(50, req);

            Assert.True(ok);
            var updated = context.Modules.First(m => m.Id == 50);
            Assert.Equal(100, updated.ModuleName.Length);
        }
    }
}
