using ActiveLearningSystem.ViewModel.ManagerViewModels;
using ActiveLearningSystem.ViewModel.PublicViewModels;
using ActiveLearningSystem.ViewModel.PupilviewModels;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ActiveLearningSystem.Services.ParentServices
{
    public interface IChildrenProgressService
    {
        Task<ParentDashboardVM> GetDashboardAsync(int accountId); 
        Task<List<CourseOverviewVM>> GetCoursesByStudentAsync(int userId); 
        Task<CourseProgressDetailVM?> GetCourseProgressDetailAsync(int courseStudentId);
    }
}