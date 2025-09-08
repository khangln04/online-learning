using ActiveLearningSystem.ViewModel;
using ActiveLearningSystem.ViewModel.InstructorViewModels;

namespace ActiveLearningSystem.Services.InstructorServices
{
    public interface IModuleListService
    {
        List<ModuleManagerVM> GetModulesByCourseId(int courseId);
        ModuleDetailsManagerVM? GetModuleDetailsById(int moduleId);
        bool UpdateModule(int moduleId, UpdateModuleVM model);
        bool AddModuleToCourse(int courseId, CreateModuleVM model);
        void DeleteModule(int moduleId);
        List<ModuleVM> GetAllModule(int courseId);
    }
}
