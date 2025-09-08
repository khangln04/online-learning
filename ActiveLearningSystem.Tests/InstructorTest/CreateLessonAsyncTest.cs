using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ActiveLearningSystem.Model;
using ActiveLearningSystem.Services.InstructorServices;
using ActiveLearningSystem.Services.PublicServices;
using ActiveLearningSystem.Services.PupilSerivces;
using ActiveLearningSystem.ViewModel.InstructorViewModels;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace ActiveLearningSystem.Tests.InstructorTest
{
    public class CreateLessonAsyncTest
    {
        private LessonManageService BuildService(string dbName, out AlsContext ctx)
        {
            var options = new DbContextOptionsBuilder<AlsContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;

            ctx = new AlsContext(options);

            // Mock AutoMapper
            var mapperMock = new Mock<IMapper>();
            mapperMock.Setup(m => m.Map<Lesson>(It.IsAny<LessonCreateVM>()))
                      .Returns<LessonCreateVM>(vm => new Lesson
                      {
                          Title = vm.Title,
                          Link = vm.Link,
                          Description = vm.Description,
                          DurationSeconds = vm.DurationSeconds ?? 0,
                          ModuleId = vm.ModuleId
                      });

            // Mock IVideoService
            var videoServiceMock = new Mock<IVideoService>();
            // tuỳ nếu bạn cần setup thêm, còn không thì để trống vẫn ổn

            return new LessonManageService(ctx, mapperMock.Object, videoServiceMock.Object);
        }

        [Fact(DisplayName = "UTCID01 - Tạo lesson thành công với dữ liệu hợp lệ")]
        public async Task UTCID01_ValidData_ReturnsTrue()
        {
            var service = BuildService(nameof(UTCID01_ValidData_ReturnsTrue), out var context);

            context.Modules.Add(new Module { Id = 1, ModuleName = "Module 1", Description = "Mô tả" });
            await context.SaveChangesAsync();

            var req = new LessonCreateVM
            {
                Title = "Bài học 1",
                Link = "http://video.com/1",
                Description = "Giới thiệu",
                DurationSeconds = 300,
                ModuleId = 1
            };

            var ok = await service.CreateLessonAsync(req);

            Assert.True(ok);
            var saved = context.Lessons.FirstOrDefault();
            Assert.NotNull(saved);
            Assert.Equal("Bài học 1", saved.Title);
            Assert.Equal(300, saved.DurationSeconds);
            Assert.Equal(1, saved.VideoNum);
        }


        [Theory(DisplayName = "UTCID02 - Validate dữ liệu không hợp lệ (trường hợp cơ bản)")]
        [InlineData(null, "http://link.com", "desc", 100, "❌ Lỗi: Title không được để trống.")]
        [InlineData(" ", "http://link.com", "desc", 100, "❌ Lỗi: Title không được để trống.")]
        [InlineData("Bài học", null, "desc", 100, "❌ Lỗi: Link không được để trống.")]
        [InlineData("Bài học", "   ", "desc", 100, "❌ Lỗi: Link không được để trống.")]
        [InlineData("Bài học", "http://link.com", null, 100, "❌ Lỗi: Description không được để trống.")]
        [InlineData("Bài học", "http://link.com", "   ", 100, "❌ Lỗi: Description không được để trống.")]
        [InlineData("Bài học", "http://link.com", "desc", null, "❌ Lỗi: Duration phải lớn hơn 0.")]
        [InlineData("Bài học", "http://link.com", "desc", 0, "❌ Lỗi: Duration phải lớn hơn 0.")]
        [InlineData("Bài học", "http://link.com", "desc", -50, "❌ Lỗi: Duration phải lớn hơn 0.")]
        public async Task UTCID02_InvalidData_BasicCases_ReturnsFalse(
            string title, string link, string desc, int? duration, string expectedLog)
        {
            var service = BuildService(nameof(UTCID02_InvalidData_BasicCases_ReturnsFalse) + Guid.NewGuid(), out var context);

            context.Modules.Add(new Module { Id = 1, ModuleName = "Module 1", Description = "Mô tả" });
            await context.SaveChangesAsync();

            var req = new LessonCreateVM
            {
                Title = title,
                Link = link,
                Description = desc,
                DurationSeconds = duration,
                ModuleId = 1
            };

            var originalOut = Console.Out;
            using var sw = new StringWriter();
            Console.SetOut(sw);

            try
            {
                var ok = await service.CreateLessonAsync(req);

                Assert.False(ok);
                var log = sw.ToString();
                Assert.Contains(expectedLog, log);
                Assert.False(context.Lessons.Any());
            }
            finally
            {
                Console.SetOut(originalOut);
            }
        }

        [Fact(DisplayName = "UTCID02A - Link quá dài > 200 ký tự")]
        public async Task UTCID02A_LinkTooLong_ReturnsFalse()
        {
            var service = BuildService(nameof(UTCID02A_LinkTooLong_ReturnsFalse), out var context);

            context.Modules.Add(new Module { Id = 1, ModuleName = "Module 1", Description = "Mô tả" });
            await context.SaveChangesAsync();

            var req = new LessonCreateVM
            {
                Title = "Bài học",
                Link = new string('A', 201),
                Description = "desc",
                DurationSeconds = 100,
                ModuleId = 1
            };

            using var sw = new StringWriter();
            Console.SetOut(sw);

            var ok = await service.CreateLessonAsync(req);

            Assert.False(ok);
            Assert.Contains("❌ Lỗi: Link không được vượt quá 200 ký tự.", sw.ToString());
        }

        [Fact(DisplayName = "UTCID02B - Description quá dài > 200 ký tự")]
        public async Task UTCID02B_DescriptionTooLong_ReturnsFalse()
        {
            var service = BuildService(nameof(UTCID02B_DescriptionTooLong_ReturnsFalse), out var context);

            context.Modules.Add(new Module { Id = 1, ModuleName = "Module 1", Description = "Mô tả" });
            await context.SaveChangesAsync();

            var req = new LessonCreateVM
            {
                Title = "Bài học",
                Link = "http://link.com",
                Description = new string('B', 201),
                DurationSeconds = 100,
                ModuleId = 1
            };

            using var sw = new StringWriter();
            Console.SetOut(sw);

            var ok = await service.CreateLessonAsync(req);

            Assert.False(ok);
            Assert.Contains("❌ Lỗi: Description không được vượt quá 200 ký tự.", sw.ToString());
        }

        [Fact(DisplayName = "UTCID03 - Module không tồn tại")]
        public async Task UTCID03_ModuleNotFound_ReturnsFalse()
        {
            var service = BuildService(nameof(UTCID03_ModuleNotFound_ReturnsFalse), out var context);

            var req = new LessonCreateVM
            {
                Title = "Bài học",
                Link = "http://link.com",
                Description = "desc",
                DurationSeconds = 100,
                ModuleId = 999
            };

            using var sw = new StringWriter();
            Console.SetOut(sw);

            var ok = await service.CreateLessonAsync(req);

            Assert.False(ok);
            Assert.Contains("❌ Lỗi: Module không tồn tại.", sw.ToString());
        }

        [Fact(DisplayName = "UTCID04 - Trim dữ liệu trước khi lưu")]
        public async Task UTCID04_TrimmedBeforeSave()
        {
            var service = BuildService(nameof(UTCID04_TrimmedBeforeSave), out var context);

            context.Modules.Add(new Module { Id = 1, ModuleName = "Module 1", Description = "Mô tả" });
            await context.SaveChangesAsync();

            var req = new LessonCreateVM
            {
                Title = "   Bài học   ",
                Link = "   http://link.com   ",
                Description = "   desc   ",
                DurationSeconds = 120,
                ModuleId = 1
            };

            var ok = await service.CreateLessonAsync(req);

            Assert.True(ok);
            var saved = context.Lessons.First();
            Assert.Equal("Bài học", saved.Title);
            Assert.Equal("http://link.com", saved.Link);
            Assert.Equal("desc", saved.Description);
        }

        [Fact(DisplayName = "UTCID05 - Link/Description đúng biên 200 ký tự hợp lệ")]
        public async Task UTCID05_Boundary200Chars_Pass()
        {
            var service = BuildService(nameof(UTCID05_Boundary200Chars_Pass), out var context);

            context.Modules.Add(new Module { Id = 1, ModuleName = "Module 1", Description = "Mô tả" });
            await context.SaveChangesAsync();

            var link200 = new string('A', 200);
            var desc200 = new string('B', 200);

            var req = new LessonCreateVM
            {
                Title = "Bài học",
                Link = link200,
                Description = desc200,
                DurationSeconds = 200,
                ModuleId = 1
            };

            var ok = await service.CreateLessonAsync(req);

            Assert.True(ok);
            var saved = context.Lessons.First();
            Assert.Equal(200, saved.Link.Length);
            Assert.Equal(200, saved.Description.Length);
        }

        [Fact(DisplayName = "UTCID06 - Tự động tăng VideoNum")]
        public async Task UTCID06_AutoIncrementVideoNum()
        {
            var service = BuildService(nameof(UTCID06_AutoIncrementVideoNum), out var context);

            context.Modules.Add(new Module { Id = 1, ModuleName = "Module 1", Description = "Mô tả" });
            context.Lessons.Add(new Lesson { Id = 1, Title = "Bài 1", Link = "link", Description = "desc", ModuleId = 1, VideoNum = 1 });
            context.Lessons.Add(new Lesson { Id = 2, Title = "Bài 2", Link = "link2", Description = "desc2", ModuleId = 1, VideoNum = 2 });
            await context.SaveChangesAsync();

            var req = new LessonCreateVM
            {
                Title = "Bài 3",
                Link = "http://link.com/3",
                Description = "desc3",
                DurationSeconds = 120,
                ModuleId = 1
            };

            var ok = await service.CreateLessonAsync(req);

            Assert.True(ok);
            var saved = context.Lessons.OrderByDescending(l => l.VideoNum).First();
            Assert.Equal(3, saved.VideoNum);
        }
    }
}
