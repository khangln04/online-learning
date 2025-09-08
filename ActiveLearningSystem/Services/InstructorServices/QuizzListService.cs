using ActiveLearningSystem.Model;
using ActiveLearningSystem.ViewModel.InstructorViewModels;
using ActiveLearningSystem.ViewModel.PupilviewModels;
using AutoMapper;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Metadata.Ecma335;

namespace ActiveLearningSystem.Services.InstructorServices
{
    public class QuizzListService : IQuizzListService
    {
        private readonly AlsContext _context;
        private readonly IMapper _mapper;

        public QuizzListService(AlsContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public List<QuizzManageVM> GetQuizzByModuleId(int moduleId)
        {
            var quizzs = _context.Quizzs
                .Where(x => x.ModuleId == moduleId)
                .ToList();

            return _mapper.Map<List<QuizzManageVM>>(quizzs);
        }

        public List<QuizzManageVM> GetQuizzList()
        {
            var quizzs = _context.Quizzs
                .Include(q => q.Module)
                .ToList();

            return _mapper.Map<List<QuizzManageVM>>(quizzs);
        }

        public void CreateQuizz(QuizzCreateVM quizzCreateVM)
        {
            var existingQuizz = _context.Quizzs
                .Any(q => q.ModuleId == quizzCreateVM.ModuleId && q.Status);

            if (existingQuizz)
            {
                throw new Exception("Module này đã có quizz đang hoạt động.");
            }

            var quizz = _mapper.Map<Quizz>(quizzCreateVM);
            quizz.Status = true;
            quizz.CreateAt = DateTime.Now;

            _context.Quizzs.Add(quizz);
            _context.SaveChanges();
        }

        public void UpdateQuizz(int quizzId, UpdateQuizzVM quizzUpdateVM)
        {
            var quizz = _context.Quizzs
                .Include(q => q.QuizzTopics)
                .FirstOrDefault(q => q.Id == quizzId);

            if (quizz == null)
            {
                throw new Exception("Quizz không tồn tại.");
            }

            // Nếu quizz đã có topic thì kiểm tra số lượng câu hỏi
            if (quizz.QuizzTopics.Any())
            {
                var topicIds = quizz.QuizzTopics.Select(qt => qt.TopicId).ToList();

                int totalQuestions = _context.Questions
                    .Count(q => topicIds.Contains(q.TopicId));

                if (quizzUpdateVM.QuestionCount > totalQuestions)
                {
                    throw new Exception(
                        $"Không thể đặt số lượng câu hỏi yêu cầu là {quizzUpdateVM.QuestionCount} vì tổng số câu hỏi trong các topic hiện tại chỉ có {totalQuestions}. " +
                        "Vui lòng thêm topic khác hoặc giảm số lượng câu hỏi yêu cầu."
                    );
                }
            }

            // Map các giá trị khác (tránh map QuestionCount trước khi check)
            _mapper.Map(quizzUpdateVM, quizz);

            _context.SaveChanges();
        }


        public void UpdateTopicsOfQuizz(int quizzId, List<int> newTopicIds)
        {
            var quizz = _context.Quizzs
                .Include(q => q.QuizzTopics)
                .FirstOrDefault(q => q.Id == quizzId);

            if (quizz == null)
            {
                throw new Exception("Quizz không tồn tại.");
            }

            int moduleId = quizz.ModuleId;
            var module = _context.Modules.FirstOrDefault(q => q.Id == moduleId);
            var course = _context.Courses.FirstOrDefault(m => m.CourseId == module.CourseId);
            int categoryId = course.CategoryId;
            var classId = course.ClassId;

            // Lấy danh sách topic hợp lệ
            var validTopicIds = _context.Topics
                .Where(t => t.CategoryId == categoryId && t.ClassId == classId)
                .Select(t => t.Id)
                .ToList();

            // Kiểm tra topic hợp lệ
            if (!newTopicIds.All(id => validTopicIds.Contains(id)))
            {
                throw new Exception("Một hoặc nhiều Topic ID không hợp lệ.");
            }

            // Tính tổng số câu hỏi thuộc các topic mới
            int totalQuestions = _context.Questions
                .Count(q => newTopicIds.Contains(q.TopicId));

            if (totalQuestions < quizz.QuestionCount)
            {
                throw new Exception($"Tổng số câu hỏi ({totalQuestions}) nhỏ hơn số câu hỏi yêu cầu của quiz ({quizz.QuestionCount}). " +
                                    "Vui lòng thêm topic khác hoặc chỉnh lại số lượng câu hỏi yêu cầu.");
            }

            // Xóa topic cũ
            _context.QuizzTopics.RemoveRange(quizz.QuizzTopics);

            // Thêm topic mới
            foreach (var topicId in newTopicIds)
            {
                _context.QuizzTopics.Add(new QuizzTopic
                {
                    QuizzId = quizzId,
                    TopicId = topicId
                });
            }

            _context.SaveChanges();
        }

        public QuizzManageVM GetQuizzById(int id)
        {
            var quizz = _context.Quizzs
                .Include(q => q.Module)
                .Include(q => q.QuizzTopics)
                    .ThenInclude(qt => qt.Topic) // Bao gồm dữ liệu Topic liên quan
                .Include(q => q.Module) // Include related data if necessary
                .FirstOrDefault(q => q.Id == id);

            if (quizz == null)
            {
                throw new Exception("Quizz không tồn tại.");
            }

            // Ánh xạ thực thể thành ViewModel
            return _mapper.Map<QuizzManageVM>(quizz);
        }
        public void LockUnlockQuizz(int quizzId)
        {
            var quizz = _context.Quizzs.FirstOrDefault(q => q.Id == quizzId);
            if (quizz == null)
            {
                throw new Exception("Quizz không tồn tại.");
            }

            int moduleId = quizz.ModuleId;

            // Check if there are any quizzes with the same moduleId that are currently active
            bool hasActiveQuizz = _context.Quizzs.Any(q => q.ModuleId == moduleId && q.Status == true && q.Id != quizzId);

            if (quizz.Status == true && hasActiveQuizz)
            {
                // If the quiz is currently active and another quiz is also active in the same module, throw an error
                throw new Exception("Không thể bật trạng thái khi đã có quiz đang hoạt động trong module này.");
            }

            // Toggle the status
            quizz.Status = !quizz.Status;

            // If the quiz is being set to active, ensure no other quiz is already active in the same module
            if (quizz.Status == true && hasActiveQuizz)
            {
                throw new Exception("Không thể bật trạng thái cho quiz này khi đã có quiz đang hoạt động.");
            }

            _context.SaveChanges();
        }
        public List<TopicVM> GetTopicDropdown(int quizzId)
        {
            // Lấy thông tin quizz để lấy ClassId và CategoryId
            var quizz = _context.Quizzs
                .Include(q => q.Module)
                .ThenInclude(m => m.Course) // Giả sử Course có ClassId và CategoryId
                .FirstOrDefault(q => q.Id == quizzId);

            if (quizz == null)
            {
                throw new Exception("Quizz không tồn tại.");
            }

            var classId = quizz.Module.Course.ClassId;
            int categoryId = quizz.Module.Course.CategoryId;

            // Lấy danh sách topic hợp lệ theo ClassId và CategoryId
            var topics = _context.Topics
                .Where(t => t.ClassId == classId && t.CategoryId == categoryId)
                .Include(t => t.Class)
                .Include(t => t.Category)
                .Select(t => new TopicVM
                {
                    Id = t.Id,
                    Name = t.Name,
                    ClassId = t.ClassId,
                    ClassName = t.Class.Name,
                    CategoryId = t.CategoryId,
                    CategoryName = t.Category.Name,
                })
                .ToList();

            return topics;
        }
    }
}