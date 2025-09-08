using ActiveLearningSystem.Model;
using ActiveLearningSystem.ViewModel.ManagerViewModels;
using ActiveLearningSystem.ViewModel.PublicViewModels;
using ActiveLearningSystem.ViewModel.PupilviewModels;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ActiveLearningSystem.ViewModel.ParentViewModels;

namespace ActiveLearningSystem.Services.ParentServices
{
    public class ChildProgressService : IChildrenProgressService
    {
        private readonly AlsContext _context;
        private readonly IMapper _mapper;

        public ChildProgressService(AlsContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<ParentDashboardVM> GetDashboardAsync(int accountId)
        {
            var user = await _context.Profiles
                .FirstOrDefaultAsync(p => p.AccountId == accountId);

            if (user == null)
            {
                return new ParentDashboardVM
                {
                    Children = new List<MyProfileVM>(),
                    ChildProgressDetails = new List<ChildProgressDetailVM>() // Đảm bảo danh sách rỗng
                };
            }

            var children = await _context.Profiles
                .Where(x => x.ParentId == user.UserId)
                .ToListAsync();

            var childProgressDetails = new List<ChildProgressDetailVM>();

            foreach (var child in children)
            {
                var courses = await GetCoursesByStudentAsync(child.UserId);
                var courseProgressDetails = new List<CourseProgressDetailVM>();

                foreach (var course in courses)
                {
                    var progressDetail = await GetCourseProgressDetailAsync(course.CourseId);
                    if (progressDetail != null)
                    {
                        courseProgressDetails.Add(progressDetail);
                    }
                }

                childProgressDetails.Add(new ChildProgressDetailVM
                {
                    Child = _mapper.Map<MyProfileVM>(child),
                    CourseProgressDetails = courseProgressDetails
                });
            }

            return new ParentDashboardVM
            {
                Children = _mapper.Map<List<MyProfileVM>>(children),
                ChildProgressDetails = childProgressDetails
            };
        }
public async Task<List<CourseOverviewVM>> GetCoursesByStudentAsync(int userId)
        {
            var studentCourses = await _context.StudentCourses
                .Where(sc => sc.PupilId == userId)
                .ToListAsync();

            return _mapper.Map<List<CourseOverviewVM>>(studentCourses);
        }

        public async Task<CourseProgressDetailVM?> GetCourseProgressDetailAsync(int courseStudentId)
        {
            var progress = await _context.CourseProgresses
                .Include(cp => cp.ModuleProgresses)
                    .ThenInclude(mp => mp.Module)
                .Include(cp => cp.ModuleProgresses)
                    .ThenInclude(mp => mp.LessonProgresses)
                        .ThenInclude(lp => lp.Video)
                .FirstOrDefaultAsync(cp => cp.CourseStudentId == courseStudentId);

            return progress == null ? null : _mapper.Map<CourseProgressDetailVM>(progress);
        }
    }
}