using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ActiveLearningSystem.Model;
using ActiveLearningSystem.Services.InstructorServices;
using ActiveLearningSystem.ViewModel.InstructorViewModels;
using Microsoft.EntityFrameworkCore;

namespace ActiveLearningSystem.Tests.InstructorTest
{
    public class UpdateLessonAsyncTest
    {
        private AlsContext BuildContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<AlsContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;

            return new AlsContext(options);
        }

        private LessonManageService BuildService(string dbName, out AlsContext ctx)
        {
            ctx = BuildContext(dbName);
            return new LessonManageService(ctx, null!, null!); // mapper, videoService chưa dùng
        }

        [Fact(DisplayName = "UTCID01 - Cập nhật lesson thành công với dữ liệu hợp lệ")]
        public async Task UTCID01_ValidData_ReturnsTrue()
        {
            var service = BuildService(nameof(UTCID01_ValidData_ReturnsTrue), out var context);

            context.Lessons.Add(new Lesson
            {
                Id = 1,
                Title = "Old Title",
                Link = "http://old-link",
                Description = "Old desc",
                DurationSeconds = 100,
                VideoNum = 1,
                ModuleId = 1
            });
            await context.SaveChangesAsync();

            var req = new LessonUpdateVM
            {
                Title = "New Title",
                Link = "http://new-link",
                Description = "New desc",
                DurationSeconds = 200,
                VideoNum = 2
            };

            var ok = await service.UpdateLessonAsync(1, req);

            Assert.True(ok);
            var updated = await context.Lessons.FirstOrDefaultAsync(l => l.Id == 1);
            Assert.NotNull(updated);
            Assert.Equal("New Title", updated.Title);
            Assert.Equal("http://new-link", updated.Link);
            Assert.Equal("New desc", updated.Description);
            Assert.Equal(200, updated.DurationSeconds);
            Assert.Equal(2, updated.VideoNum);
        }

        [Theory(DisplayName = "UTCID02 - Validate Title/Link/Description không hợp lệ")]
        [InlineData("", "http://link", "desc", 100, "Title không được để trống.")]
        [InlineData("   ", "http://link", "desc", 100, "Title không được để trống.")]
        [InlineData("Title", "", "desc", 100, "Link không được để trống.")]
        [InlineData("Title", "   ", "desc", 100, "Link không được để trống.")]
        [InlineData("Title", "http://link", "", 100, "Description không được để trống.")]
        [InlineData("Title", "http://link", "   ", 100, "Description không được để trống.")]
        public async Task UTCID02_InvalidStrings_Throws(string title, string link, string desc, int duration, string expectedMsg)
        {
            var dbName = $"{nameof(UTCID02_InvalidStrings_Throws)}_{Guid.NewGuid()}";
            var service = BuildService(dbName, out var context);

            context.Lessons.Add(new Lesson
            {
                Id = 1,
                Title = "Old Title",
                Link = "http://old",
                Description = "Old desc",
                DurationSeconds = 100,
                VideoNum = 1,
                ModuleId = 1
            });
            await context.SaveChangesAsync();

            var req = new LessonUpdateVM
            {
                Title = title,
                Link = link,
                Description = desc,
                DurationSeconds = duration,
                VideoNum = 1
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => service.UpdateLessonAsync(1, req));
            Assert.Equal(expectedMsg, ex.Message);
        }


        [Fact(DisplayName = "UTCID02A - Link quá 200 ký tự")]
        public async Task UTCID02A_LinkTooLong_Throws()
        {
            var service = BuildService(nameof(UTCID02A_LinkTooLong_Throws), out var context);
            context.Lessons.Add(new Lesson { Id = 1, Title = "Old", Link = "http://old", Description = "old", DurationSeconds = 10, VideoNum = 1, ModuleId = 1 });
            await context.SaveChangesAsync();

            var req = new LessonUpdateVM
            {
                Title = "Title",
                Link = new string('A', 201),
                Description = "desc",
                DurationSeconds = 100,
                VideoNum = 1
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => service.UpdateLessonAsync(1, req));
            Assert.Equal("Link không được vượt quá 200 ký tự.", ex.Message);
        }

        [Fact(DisplayName = "UTCID02B - Description quá 200 ký tự")]
        public async Task UTCID02B_DescriptionTooLong_Throws()
        {
            var service = BuildService(nameof(UTCID02B_DescriptionTooLong_Throws), out var context);
            context.Lessons.Add(new Lesson { Id = 1, Title = "Old", Link = "http://old", Description = "old", DurationSeconds = 10, VideoNum = 1, ModuleId = 1 });
            await context.SaveChangesAsync();

            var req = new LessonUpdateVM
            {
                Title = "Title",
                Link = "http://link",
                Description = new string('B', 201),
                DurationSeconds = 100,
                VideoNum = 1
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => service.UpdateLessonAsync(1, req));
            Assert.Equal("Description không được vượt quá 200 ký tự.", ex.Message);
        }

        [Theory(DisplayName = "UTCID03 - DurationSeconds không hợp lệ")]
        [InlineData(0)]
        [InlineData(-5)]
        public async Task UTCID03_InvalidDuration_Throws(int duration)
        {
            var dbName = $"{nameof(UTCID03_InvalidDuration_Throws)}_{Guid.NewGuid()}"; // 👈 unique mỗi case
            var service = BuildService(dbName, out var context);

            context.Lessons.Add(new Lesson
            {
                Id = 1,
                Title = "Old",
                Link = "http://old",
                Description = "old",
                DurationSeconds = 10,
                VideoNum = 1,
                ModuleId = 1
            });
            await context.SaveChangesAsync();

            var req = new LessonUpdateVM
            {
                Title = "Title",
                Link = "http://link",
                Description = "desc",
                DurationSeconds = duration,
                VideoNum = 1
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => service.UpdateLessonAsync(1, req));
            Assert.Equal("Duration phải lớn hơn 0.", ex.Message);
        }


        [Fact(DisplayName = "UTCID04 - Không tìm thấy Lesson")]
        public async Task UTCID04_NotFound_Throws()
        {
            var service = BuildService(nameof(UTCID04_NotFound_Throws), out var context);

            var req = new LessonUpdateVM
            {
                Title = "Title",
                Link = "http://link",
                Description = "desc",
                DurationSeconds = 100,
                VideoNum = 1
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => service.UpdateLessonAsync(999, req));
            Assert.Equal("Không tìm thấy Lesson.", ex.Message);
        }
    }
}
