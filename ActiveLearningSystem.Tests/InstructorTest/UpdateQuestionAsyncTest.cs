using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ActiveLearningSystem.Model;
using ActiveLearningSystem.ViewModel.InstructorViewModels;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ActiveLearningSystem.Tests.InstructorTest
{
    public class UpdateQuestionAsyncTest
    {
        private QuestionAnswerServices BuildService(string dbName, out AlsContext context)
        {
            var options = new DbContextOptionsBuilder<AlsContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;

            context = new AlsContext(options);

            return new QuestionAnswerServices(context, null!);
        }

        [Fact(DisplayName = "UTCID01 - Cập nhật câu hỏi thành công với dữ liệu hợp lệ")]
        public async Task UTCID01_ValidData_ReturnsTrue()
        {
            var dbName = $"{nameof(UTCID01_ValidData_ReturnsTrue)}_{Guid.NewGuid()}";
            var service = BuildService(dbName, out var context);

            // Insert dữ liệu gốc
            var question = new Question { Content = "Câu hỏi cũ?", TopicId = 1, CreatedDate = DateOnly.FromDateTime(DateTime.Now) };
            context.Questions.Add(question);
            await context.SaveChangesAsync();

            context.Answers.AddRange(
                new Answer { QuesId = question.Id, Content = "A", IsCorrect = true },
                new Answer { QuesId = question.Id, Content = "B", IsCorrect = false },
                new Answer { QuesId = question.Id, Content = "C", IsCorrect = false },
                new Answer { QuesId = question.Id, Content = "D", IsCorrect = false }
            );
            await context.SaveChangesAsync();

            var newQuestionVM = new QuestionCreateVM { Content = "Câu hỏi mới?", TopicId = 1 };
            var newAnswers = new List<AnswerCreateVM>
        {
            new AnswerCreateVM { Content = "Đáp án 1", IsCorrect = true },
            new AnswerCreateVM { Content = "Đáp án 2", IsCorrect = false },
            new AnswerCreateVM { Content = "Đáp án 3", IsCorrect = false },
            new AnswerCreateVM { Content = "Đáp án 4", IsCorrect = false }
        };

            var result = await service.UpdateQuestionAsync(question.Id, newQuestionVM, newAnswers);

            Assert.True(result);
        }

        [Fact(DisplayName = "UTCID02 - Không tìm thấy câu hỏi")]
        public async Task UTCID02_QuestionNotFound_Throws()
        {
            var dbName = $"{nameof(UTCID02_QuestionNotFound_Throws)}_{Guid.NewGuid()}";
            var service = BuildService(dbName, out var context);

            var questionVM = new QuestionCreateVM { Content = "Câu hỏi?", TopicId = 1 };
            var answers = new List<AnswerCreateVM>
        {
            new AnswerCreateVM { Content = "A", IsCorrect = true },
            new AnswerCreateVM { Content = "B", IsCorrect = false },
            new AnswerCreateVM { Content = "C", IsCorrect = false },
            new AnswerCreateVM { Content = "D", IsCorrect = false }
        };

            var ex = await Assert.ThrowsAsync<Exception>(() => service.UpdateQuestionAsync(999, questionVM, answers));
            Assert.Equal("❌ Không tìm thấy câu hỏi.", ex.Message);
        }

        [Fact(DisplayName = "UTCID03 - Nội dung câu hỏi trống")]
        public async Task UTCID03_EmptyContent_Throws()
        {
            var dbName = $"{nameof(UTCID03_EmptyContent_Throws)}_{Guid.NewGuid()}";
            var service = BuildService(dbName, out var context);

            var question = new Question { Content = "Câu hỏi cũ?", TopicId = 1, CreatedDate = DateOnly.FromDateTime(DateTime.Now) };
            context.Questions.Add(question);
            await context.SaveChangesAsync();

            var questionVM = new QuestionCreateVM { Content = "   ", TopicId = 1 };
            var answers = new List<AnswerCreateVM>
        {
            new AnswerCreateVM { Content = "A", IsCorrect = true },
            new AnswerCreateVM { Content = "B", IsCorrect = false },
            new AnswerCreateVM { Content = "C", IsCorrect = false },
            new AnswerCreateVM { Content = "D", IsCorrect = false }
        };

            var ex = await Assert.ThrowsAsync<Exception>(() => service.UpdateQuestionAsync(question.Id, questionVM, answers));
            Assert.Equal("❌ Nội dung câu hỏi không được để trống.", ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Không đủ 4 đáp án")]
        public async Task UTCID04_NotEnoughAnswers_Throws()
        {
            var dbName = $"{nameof(UTCID04_NotEnoughAnswers_Throws)}_{Guid.NewGuid()}";
            var service = BuildService(dbName, out var context);

            var question = new Question { Content = "Câu hỏi cũ?", TopicId = 1, CreatedDate = DateOnly.FromDateTime(DateTime.Now) };
            context.Questions.Add(question);
            await context.SaveChangesAsync();

            var questionVM = new QuestionCreateVM { Content = "Câu hỏi mới?", TopicId = 1 };
            var answers = new List<AnswerCreateVM>
        {
            new AnswerCreateVM { Content = "A", IsCorrect = true },
            new AnswerCreateVM { Content = "B", IsCorrect = false }
        };

            var ex = await Assert.ThrowsAsync<Exception>(() => service.UpdateQuestionAsync(question.Id, questionVM, answers));
            Assert.Equal("❌ Mỗi câu hỏi phải có đúng 4 đáp án.", ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Có nhiều hơn 1 đáp án đúng")]
        public async Task UTCID05_MultipleCorrectAnswers_Throws()
        {
            var dbName = $"{nameof(UTCID05_MultipleCorrectAnswers_Throws)}_{Guid.NewGuid()}";
            var service = BuildService(dbName, out var context);

            var question = new Question { Content = "Câu hỏi cũ?", TopicId = 1, CreatedDate = DateOnly.FromDateTime(DateTime.Now) };
            context.Questions.Add(question);
            await context.SaveChangesAsync();

            var questionVM = new QuestionCreateVM { Content = "Câu hỏi mới?", TopicId = 1 };
            var answers = new List<AnswerCreateVM>
        {
            new AnswerCreateVM { Content = "A", IsCorrect = true },
            new AnswerCreateVM { Content = "B", IsCorrect = true },
            new AnswerCreateVM { Content = "C", IsCorrect = false },
            new AnswerCreateVM { Content = "D", IsCorrect = false }
        };

            var ex = await Assert.ThrowsAsync<Exception>(() => service.UpdateQuestionAsync(question.Id, questionVM, answers));
            Assert.Equal("❌ Mỗi câu hỏi phải có đúng 1 đáp án đúng.", ex.Message);
        }

        [Fact(DisplayName = "UTCID06 - Tất cả đáp án giống nhau")]
        public async Task UTCID06_AllAnswersSame_Throws()
        {
            var dbName = $"{nameof(UTCID06_AllAnswersSame_Throws)}_{Guid.NewGuid()}";
            var service = BuildService(dbName, out var context);

            var question = new Question { Content = "Câu hỏi cũ?", TopicId = 1, CreatedDate = DateOnly.FromDateTime(DateTime.Now) };
            context.Questions.Add(question);
            await context.SaveChangesAsync();

            var questionVM = new QuestionCreateVM { Content = "Câu hỏi mới?", TopicId = 1 };
            var answers = new List<AnswerCreateVM>
        {
            new AnswerCreateVM { Content = "A", IsCorrect = true },
            new AnswerCreateVM { Content = "A", IsCorrect = false },
            new AnswerCreateVM { Content = "A", IsCorrect = false },
            new AnswerCreateVM { Content = "A", IsCorrect = false }
        };

            var ex = await Assert.ThrowsAsync<Exception>(() => service.UpdateQuestionAsync(question.Id, questionVM, answers));
            Assert.Equal("❌ Không được để tất cả đáp án giống nhau.", ex.Message);
        }
    }
}
