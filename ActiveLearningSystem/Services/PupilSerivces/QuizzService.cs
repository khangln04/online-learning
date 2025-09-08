using ActiveLearningSystem.Model;
using ActiveLearningSystem.ViewModel.PublicViewModels;
using ActiveLearningSystem.ViewModel.PupilviewModels.QuizzViewModels;
using ActiveLearningSystem.ViewModel.PupilviewModels;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ActiveLearningSystem.Services.PupilSerivces;

namespace ActiveLearningSystem.Services.PupilServices
{
    public class QuizzService : IQuizzService
    {
        private readonly AlsContext _context;
        private readonly IMapper _mapper;
        private readonly ICourseProgressService _courseProgressService;

        public QuizzService(AlsContext context, IMapper mapper, ICourseProgressService courseProgressService)
        {
            _context = context;
            _mapper = mapper;
            _courseProgressService = courseProgressService;
        }

        public async Task<QuizzVM> GetQuizzInfo(int quizzId)
        {
            var quizz = await _context.Quizzs
                .Include(q => q.Module)
                .FirstOrDefaultAsync(q => q.Id == quizzId);

            return quizz == null ? null : _mapper.Map<QuizzVM>(quizz);
        }

        public async Task<List<TopicVM>> GetAllTopics(int quizzId)
        {
            var topics = await _context.QuizzTopics
                .Where(q => q.QuizzId == quizzId)
                .Include(qt => qt.Topic)
                .Select(qt => qt.Topic)
                .ToListAsync();

            return _mapper.Map<List<TopicVM>>(topics);
        }

        public async Task<List<QuestionsVM>> GetQuestionsByQuizz(int moduleProgressId)
        {
            var moduleProgress = await _context.ModuleProgresses.FindAsync(moduleProgressId);
            if (moduleProgress == null) return null;

            var quizz = await _context.Quizzs
                .FirstOrDefaultAsync(x => x.ModuleId == moduleProgress.ModuleId && x.Status == true);

            if (quizz == null) return null;

            var topicIds = await _context.QuizzTopics
                .Where(qt => qt.QuizzId == quizz.Id)
                .Select(qt => qt.TopicId)
                .ToListAsync();

            var questions = await _context.Questions
                .Where(q => topicIds.Contains(q.TopicId))
                .OrderBy(q => Guid.NewGuid())
                .Take(quizz.QuestionCount)
                .Include(q => q.Answers)
                .ToListAsync();

            return _mapper.Map<List<QuestionsVM>>(questions);
        }

        public async Task<UserQuizzVM> CreateUserQuiz(int moduleProgressId)
        {
            var moduleProgress = await _context.ModuleProgresses
                .Include(mp => mp.Module)
                .FirstOrDefaultAsync(mp => mp.Id == moduleProgressId);

            if (moduleProgress == null)
                throw new Exception("Không tìm thấy tiến trình mô-đun.");
            int moduleId = moduleProgress.ModuleId;

            var allLessonsInModule = await _context.Lessons
                .Where(l => l.ModuleId == moduleId)
                .Select(l => l.Id)
                .ToListAsync();

            if (!allLessonsInModule.Any())
                throw new Exception("Mô-đun này chưa có bài học nào.");

            var learnedLessons = await _context.LessonProgresses
                .Where(lp => lp.ModuleProgressId == moduleProgressId && lp.Status == true)
                .Select(lp => lp.VideoId)
                .ToListAsync();

            bool allCompleted = allLessonsInModule.All(id => learnedLessons.Contains(id));
            if (!allCompleted)
                throw new Exception("Bạn phải hoàn thành tất cả bài học trước khi làm bài kiểm tra.");

            var quizz = await _context.Quizzs
                .FirstOrDefaultAsync(x => x.ModuleId == moduleId && x.Status == true);

            if (quizz == null)
                throw new Exception("Không tìm thấy bài kiểm tra hợp lệ cho mô-đun này.");

            var userQuiz = new UserQuizz
            {
                ModuleProgressId = moduleProgressId,
                QuizId = quizz.Id,
                StartAt = DateTime.Now,
                Score = null,
                IsPass = null
            };

            _context.UserQuizzs.Add(userQuiz);
            await _context.SaveChangesAsync();

            var questions = await GetQuestionsByQuizz(moduleProgressId);
            if (questions == null || !questions.Any())
                throw new Exception("Không tìm thấy câu hỏi cho bài kiểm tra này.");

            var userQuizQuestions = new List<UserQuizzQuestion>();
            var userAnswers = new List<UserAnswer>();

            foreach (var question in questions)
            {
                userQuizQuestions.Add(new UserQuizzQuestion
                {
                    UserQuizId = userQuiz.Id,
                    Queestionid = question.Id
                });

                userAnswers.Add(new UserAnswer
                {
                    UserQuizzId = userQuiz.Id,
                    QuestionId = question.Id,
                    AnswerId = null,
                    AnswerAt = null
                });
            }

            _context.UserQuizzQuestions.AddRange(userQuizQuestions);
            _context.UserAnswers.AddRange(userAnswers);
            await _context.SaveChangesAsync();

            var userQuizVM = _mapper.Map<UserQuizzVM>(userQuiz);
            userQuizVM.Questions = questions;

            return userQuizVM;
        }


        public async Task<UserQuizzVM> GetUserQuiz(int moduleProgressId)
        {
            var userQuiz = await _context.UserQuizzs
                .Include(uq => uq.UserQuizzQuestions)
                    .ThenInclude(uqq => uqq.Queestion)
                        .ThenInclude(q => q.Answers)
                        .FirstOrDefaultAsync(uq => uq.ModuleProgressId == moduleProgressId);

            return userQuiz == null ? null : _mapper.Map<UserQuizzVM>(userQuiz);
        }

        public async Task UpdateUserAnswers(int userQuizId, UpdateUserAnswersDTO updateData)
        {
            // 1. Lấy bài kiểm tra người dùng
            var userQuiz = await _context.UserQuizzs
                .Include(uq => uq.UserAnswers)
                .Include(uq => uq.Quiz)
                .FirstOrDefaultAsync(uq => uq.Id == userQuizId);

            if (userQuiz == null)
                throw new Exception("Không tìm thấy bài kiểm tra.");

            // 2. Kiểm tra thời gian làm bài
            var allowedDuration = userQuiz.Quiz.TimeLimit;
            var duration = (DateTime.Now - userQuiz.StartAt).TotalMinutes;

            // 3. Cập nhật câu trả lời trong mọi trường hợp
            var questionIds = updateData.Answers.Select(a => a.QuestionId).ToList();
            var userAnswersToUpdate = await _context.UserAnswers
                .Where(ua => ua.UserQuizzId == userQuizId && questionIds.Contains(ua.QuestionId))
                .ToListAsync();

            if (!userAnswersToUpdate.Any())
                throw new Exception("Không tìm thấy các câu trả lời cần cập nhật.");

            foreach (var answerUpdate in updateData.Answers)
            {
                var userAnswer = userAnswersToUpdate
                    .FirstOrDefault(ua => ua.QuestionId == answerUpdate.QuestionId);

                if (userAnswer == null)
                    continue;

                // Không cho sửa câu đã trả lời
                if (userAnswer.AnswerId != null)
                    throw new Exception($"Câu hỏi {userAnswer.QuestionId} đã trả lời không thể chỉnh sửa.");

                userAnswer.AnswerId = answerUpdate.SelectedAnswerId;
                userAnswer.AnswerAt = DateTime.Now;

                // Kiểm tra đúng/sai nếu có chọn đáp án
                if (answerUpdate.SelectedAnswerId.HasValue)
                {
                    var selectedAnswer = await _context.Answers
                        .FirstOrDefaultAsync(a => a.Id == answerUpdate.SelectedAnswerId.Value);

                    userAnswer.IsCorrect = selectedAnswer?.IsCorrect ?? false;
                }
                else
                {
                    userAnswer.IsCorrect = false;
                }
            }

            // 4. Tính điểm sau cập nhật
            int correctCount = userQuiz.UserAnswers.Count(ua => ua.IsCorrect == true);
            int questionCount = userQuiz.Quiz.QuestionCount;

            float scorePerQuestion = questionCount > 0 ? 100f / questionCount : 0f;
            float totalScore = correctCount * scorePerQuestion;

            userQuiz.Score = MathF.Round(totalScore, 2); // Làm tròn đến 2 chữ số

            // Kiểm tra trạng thái IsPass
            userQuiz.IsPass = duration <= allowedDuration ? userQuiz.Score >= userQuiz.Quiz.RequiredScore : false;

            userQuiz.SubmitAt = DateTime.Now;
            userQuiz.Duration = (userQuiz.SubmitAt.Value - userQuiz.StartAt).TotalMinutes;

            await _context.SaveChangesAsync();

            var moduleProgress = await _context.ModuleProgresses
                .Include(mp => mp.CourseProcess)
                .FirstOrDefaultAsync(mp => mp.Id == userQuiz.ModuleProgressId);

            if (moduleProgress != null)
            {
                await _courseProgressService.CheckLearningProgressAsync(moduleProgress.CourseProcess.CourseStudentId);
            }
        }



        public async Task EvaluateQuiz(int userQuizId)
        {
            var userQuiz = await _context.UserQuizzs
                .Include(uq => uq.Quiz)
                .Include(uq => uq.UserAnswers)
                .ThenInclude(ua => ua.Answer)
                .FirstOrDefaultAsync(uq => uq.Id == userQuizId);

            if (userQuiz == null) return;

            int correctCount = userQuiz.UserAnswers.Count(ua => ua.Answer != null && ua.Answer.IsCorrect);
            int questionCount = userQuiz.Quiz.QuestionCount;

            float scorePerQuestion = questionCount > 0 ? 100f / questionCount : 0f;
            float totalScore = correctCount * scorePerQuestion;

            userQuiz.Score = MathF.Round(totalScore, 2);
            userQuiz.IsPass = userQuiz.Score >= userQuiz.Quiz.RequiredScore;


            await _context.SaveChangesAsync();
        }

    }
}