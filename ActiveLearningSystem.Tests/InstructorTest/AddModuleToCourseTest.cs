using System;
using System.IO;
using System.Linq;
using ActiveLearningSystem.Services; // nơi chứa ModuleListServices
using ActiveLearningSystem.ViewModel.InstructorViewModels;
using ActiveLearningSystem.Model;    // nơi chứa ActiveLearningSystemContext, Course, Module
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using ActiveLearningSystem.Services.InstructorServices;

namespace ActiveLearningSystem.Tests.UnitTest.ModuleService_UnitTest
{
    public class AddModuleToCourseTest
    {
        private ModuleListService BuildService(string dbName, out AlsContext ctx)
        {
            var options = new DbContextOptionsBuilder<AlsContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;

            ctx = new AlsContext(options);

            // Mock IMapper để không cần cài AutoMapper trong test
            var mapperMock = new Mock<IMapper>();
            mapperMock
                .Setup(m => m.Map<Module>(It.IsAny<CreateModuleVM>()))
                .Returns<CreateModuleVM>(vm => new Module
                {
                    ModuleName = vm.ModuleName,
                    Description = vm.Description
                });

            return new ModuleListService(ctx, mapperMock.Object);
        }

        [Fact(DisplayName = "UTCID01 - Thêm module thành công với dữ liệu hợp lệ")]
        public void UTCID01_ValidData_ReturnsTrue()
        {
            var service = BuildService(nameof(UTCID01_ValidData_ReturnsTrue), out var context);

            // Arrange
            context.Courses.Add(new Course
            {
                CourseId = 1,
                CourseName = "Toán",
                Description = "Môn toán cơ bản"   // thêm field bắt buộc này
            });
            context.SaveChanges();

            var req = new CreateModuleVM
            {
                ModuleName = "Hàm số",
                Description = "Giới thiệu hàm số"
            };

            // Act
            var ok = service.AddModuleToCourse(1, req);

            // Assert
            Assert.True(ok);
            var saved = context.Modules.FirstOrDefault();
            Assert.NotNull(saved);
            Assert.Equal("Hàm số", saved.ModuleName);
            Assert.Equal("Giới thiệu hàm số", saved.Description);
            Assert.Equal(1, saved.ModuleNum); // module đầu tiên
            Assert.Equal(1, saved.CourseId);
            Assert.False(saved.Status);       // theo code set false
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

            // Có course hợp lệ để service không fail vì course
            context.Courses.Add(new Course
            {
                CourseId = 2,
                CourseName = "Tên khóa học",
                Description = "Mô tả khóa học"
            });
            context.SaveChanges();

            var req = new CreateModuleVM { ModuleName = moduleName, Description = description };

            var originalOut = Console.Out;
            using var sw = new StringWriter();
            Console.SetOut(sw);

            try
            {
                // Act
                var ok = service.AddModuleToCourse(2, req);

                // Assert
                Assert.False(ok);
                var log = sw.ToString();
                Assert.Contains(expectedLog, log);
                Assert.False(context.Modules.Any()); // không lưu gì
            }
            finally
            {
                Console.SetOut(originalOut);
            }
        }

        [Fact(DisplayName = "UTCID03 - Không tìm thấy khóa học")]
        public void UTCID03_CourseNotFound_ReturnsFalse()
        {
            var service = BuildService(nameof(UTCID03_CourseNotFound_ReturnsFalse), out var _);

            var req = new CreateModuleVM
            {
                ModuleName = "Hàm số",
                Description = "Giới thiệu hàm số"
            };

            var originalOut = Console.Out;
            using var sw = new StringWriter();
            Console.SetOut(sw);

            try
            {
                // Act
                var ok = service.AddModuleToCourse(999, req);

                // Assert
                Assert.False(ok);
                var log = sw.ToString();
                Assert.Contains("❌ Lỗi: Không tìm thấy khóa học.", log);
            }
            finally
            {
                Console.SetOut(originalOut);
            }
        }

        [Fact(DisplayName = "UTCID04 - Tự động trim ModuleName/Description trước khi lưu")]
        public void UTCID04_TrimmedBeforeSave()
        {
            var service = BuildService(nameof(UTCID04_TrimmedBeforeSave), out var context);

            // Arrange
            context.Courses.Add(new Course
            {
                CourseId = 3,
                CourseName = "Tên khóa học",
                Description = "Mô tả khóa học"
            });
            context.SaveChanges();

            var req = new CreateModuleVM
            {
                ModuleName = "   Hàm số   ",
                Description = "   Giới thiệu   "
            };

            // Act
            var ok = service.AddModuleToCourse(3, req);

            // Assert
            Assert.True(ok);
            var saved = context.Modules.FirstOrDefault();
            Assert.NotNull(saved);
            Assert.Equal("Hàm số", saved.ModuleName);
            Assert.Equal("Giới thiệu", saved.Description);
        }

        [Fact(DisplayName = "UTCID05 - ModuleName đúng biên 100 ký tự thì hợp lệ")]
        public void UTCID05_Boundary_100Chars_Pass()
        {
            var service = BuildService(nameof(UTCID05_Boundary_100Chars_Pass), out var context);

            context.Courses.Add(new Course
            {
                CourseId = 4,
                CourseName = "Tên khóa học",
                Description = "Mô tả khóa học"
            });
            context.SaveChanges();

            var name100 = new string('A', 100);
            var req = new CreateModuleVM
            {
                ModuleName = name100,
                Description = "OK"
            };

            var ok = service.AddModuleToCourse(4, req);

            Assert.True(ok);
            var saved = context.Modules.First();
            Assert.Equal(100, saved.ModuleName.Length);
        }
    }
}
