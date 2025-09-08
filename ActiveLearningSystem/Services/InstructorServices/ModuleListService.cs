using System;
using ActiveLearningSystem.Model;
using ActiveLearningSystem.ViewModel;
using ActiveLearningSystem.ViewModel.InstructorViewModels;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ActiveLearningSystem.Services.InstructorServices
{
    public class ModuleListService : IModuleListService
    {

        private readonly AlsContext _context;
        private readonly IMapper _mapper;

        public ModuleListService(AlsContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public List<ModuleManagerVM> GetModulesByCourseId(int courseId)
        {
            var modules = _context.Modules
                .Where(m => m.CourseId == courseId)
                .ToList();

            return _mapper.Map<List<ModuleManagerVM>>(modules);
        }


        public ModuleDetailsManagerVM? GetModuleDetailsById(int moduleId)
        {
            var module = _context.Modules.FirstOrDefault(m => m.Id == moduleId);
            if (module == null) return null;

            return _mapper.Map<ModuleDetailsManagerVM>(module);
        }

        public bool UpdateModule(int moduleId, UpdateModuleVM model)
        {
            var module = _context.Modules.FirstOrDefault(m => m.Id == moduleId);

            if (module == null) return false;

            module.ModuleName = model.ModuleName;
            module.Description = model.Description;
            module.UpdatedDate = DateOnly.FromDateTime(DateTime.Now);

            _context.SaveChanges();
            return true;
        }

        public bool AddModuleToCourse(int courseId, CreateModuleVM model)
        {
            var course = _context.Courses.FirstOrDefault(c => c.CourseId == courseId);
            if (course == null) return false;

            var maxModuleNum = _context.Modules
                .Where(m => m.CourseId == courseId)
                .OrderByDescending(m => m.ModuleNum)
                .Select(m => m.ModuleNum)
                .FirstOrDefault();

            var nextModuleNum = maxModuleNum + 1;

            var module = _mapper.Map<Module>(model);
            module.ModuleNum = nextModuleNum;
            module.CourseId = courseId;
            module.Status = false;

            _context.Modules.Add(module);
            _context.SaveChanges();
            return true;
        }


        public void DeleteModule(int moduleId)
        {
            var module = _context.Modules
                .Include(m => m.Lessons)
                .Include(m => m.Quizzs)
                    .ThenInclude(q => q.QuizzTopics)
                .Include(m => m.Course)
                .FirstOrDefault(m => m.Id == moduleId);

            if (module == null)
                throw new Exception("Mô-đun không tồn tại.");

            foreach (var quiz in module.Quizzs)
            {
                if (quiz.QuizzTopics != null && quiz.QuizzTopics.Any())
                {
                    _context.QuizzTopics.RemoveRange(quiz.QuizzTopics);
                }
            }

            if (module.Quizzs != null && module.Quizzs.Any())
            {
                _context.Quizzs.RemoveRange(module.Quizzs);
            }

            // Xóa Lesson
            if (module.Lessons != null && module.Lessons.Any())
            {
                _context.Lessons.RemoveRange(module.Lessons);
            }

            // Xóa Module
            _context.Modules.Remove(module);

            _context.SaveChanges();
        }

        public List<ModuleVM> GetAllModule(int courseId)
        {
            var modules = _context.Modules
                .Include(m => m.Course)
                .Include(m => m.Lessons) // Bao gồm danh sách video
                .Where(x => x.CourseId == courseId)
                .Where(x => x.Status == true)
                .ToList();

            return _mapper.Map<List<ModuleVM>>(modules);
        }
    }
}
