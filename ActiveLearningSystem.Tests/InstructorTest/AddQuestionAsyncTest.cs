using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ActiveLearningSystem.Model;
using ActiveLearningSystem.ViewModel.InstructorViewModels;
using Microsoft.EntityFrameworkCore;

namespace ActiveLearningSystem.Tests.InstructorTest
{
    public class AddQuestionAsyncTest
    {
        private QuestionAnswerServices BuildService(string dbName, out AlsContext context)
        {
            var options = new DbContextOptionsBuilder<AlsContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;

            context = new AlsContext(options);

            // ❌ Ở AddQuestionAsync không cần AutoMapper nên bỏ hẳn cho gọn
            return new QuestionAnswerServices(context, null!);
        }

        [Fact(DisplayName = "UTCID01 - Thêm câu hỏi thành công với dữ liệu hợp lệ")]
        public async Task UTCID01_ValidData_ReturnsTrue()
        {
            var dbName = $"{nameof(UTCID01_ValidData_ReturnsTrue)}_{Guid.NewGuid()}";
            var service = BuildService(dbName, out var context);

            var question = new QuestionCreateVM { Content = "Câu hỏi 1?", TopicId = 1 };

            var answers = new List<AnswerCreateVM>
        {
            new AnswerCreateVM { Content = "A", IsCorrect = true },
            new AnswerCreateVM { Content = "B", IsCorrect = false },
            new AnswerCreateVM { Content = "C", IsCorrect = false },
            new AnswerCreateVM { Content = "D", IsCorrect = false }
        };

            var result = await service.AddQuestionAsync(question, answers);

            Assert.True(result);
        }

        [Fact(DisplayName = "UTCID02 - Thiếu nội dung câu hỏi")]
        public async Task UTCID02_MissingQuestionContent_Throws()
        {
            var dbName = $"{nameof(UTCID02_MissingQuestionContent_Throws)}_{Guid.NewGuid()}";
            var service = BuildService(dbName, out var context);

            var question = new QuestionCreateVM { Content = "   ", TopicId = 1 };

            var answers = new List<AnswerCreateVM>
        {
            new AnswerCreateVM { Content = "A", IsCorrect = true },
            new AnswerCreateVM { Content = "B", IsCorrect = false },
            new AnswerCreateVM { Content = "C", IsCorrect = false },
            new AnswerCreateVM { Content = "D", IsCorrect = false }
        };

            var ex = await Assert.ThrowsAsync<Exception>(() => service.AddQuestionAsync(question, answers));
            Assert.Equal("❌ Nội dung câu hỏi không được để trống.", ex.Message);
        }

        [Fact(DisplayName = "UTCID03 - Không đủ 4 đáp án")]
        public async Task UTCID03_NotEnoughAnswers_Throws()
        {
            var dbName = $"{nameof(UTCID03_NotEnoughAnswers_Throws)}_{Guid.NewGuid()}";
            var service = BuildService(dbName, out var context);

            var question = new QuestionCreateVM { Content = "Câu hỏi?", TopicId = 1 };

            var answers = new List<AnswerCreateVM>
        {
            new AnswerCreateVM { Content = "A", IsCorrect = true },
            new AnswerCreateVM { Content = "B", IsCorrect = false }
        };

            var ex = await Assert.ThrowsAsync<Exception>(() => service.AddQuestionAsync(question, answers));
            Assert.Equal("❌ Mỗi câu hỏi phải có đúng 4 đáp án.", ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Có nhiều hơn 1 đáp án đúng")]
        public async Task UTCID04_MultipleCorrectAnswers_Throws()
        {
            var dbName = $"{nameof(UTCID04_MultipleCorrectAnswers_Throws)}_{Guid.NewGuid()}";
            var service = BuildService(dbName, out var context);

            var question = new QuestionCreateVM { Content = "Câu hỏi?", TopicId = 1 };

            var answers = new List<AnswerCreateVM>
        {
            new AnswerCreateVM { Content = "A", IsCorrect = true },
            new AnswerCreateVM { Content = "B", IsCorrect = true },
            new AnswerCreateVM { Content = "C", IsCorrect = false },
            new AnswerCreateVM { Content = "D", IsCorrect = false }
        };

            var ex = await Assert.ThrowsAsync<Exception>(() => service.AddQuestionAsync(question, answers));
            Assert.Equal("❌ Mỗi câu hỏi phải có đúng 1 đáp án đúng.", ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Tất cả đáp án giống nhau")]
        public async Task UTCID05_AllAnswersSame_Throws()
        {
            var dbName = $"{nameof(UTCID05_AllAnswersSame_Throws)}_{Guid.NewGuid()}";
            var service = BuildService(dbName, out var context);

            var question = new QuestionCreateVM { Content = "Câu hỏi?", TopicId = 1 };

            var answers = new List<AnswerCreateVM>
        {
            new AnswerCreateVM { Content = "A", IsCorrect = true },
            new AnswerCreateVM { Content = "A", IsCorrect = false },
            new AnswerCreateVM { Content = "A", IsCorrect = false },
            new AnswerCreateVM { Content = "A", IsCorrect = false }
        };

            var ex = await Assert.ThrowsAsync<Exception>(() => service.AddQuestionAsync(question, answers));
            Assert.Equal("❌ Không được để tất cả đáp án giống nhau.", ex.Message);
        }
    }
}
