using ActiveLearningSystem.Model;
using ActiveLearningSystem.ViewModel.ParentViewModels;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace ActiveLearningSystem.Services.ParentServices
{
    public class PaidCourseHistoryService : IPaidCourseHistoryService
    {
        private readonly AlsContext _context;
        private readonly IMapper _mapper;

        public PaidCourseHistoryService(AlsContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<PaidCourseHistoryVM>> GetUnpaidHistoryForParentAsync(int parentUserId)
        {
            var unpaidHistory = await _context.CoursePayments
                .Where(cp => cp.PaidById == parentUserId && cp.IsPaid == false)
                .OrderByDescending(cp => cp.Id)
                .ProjectTo<PaidCourseHistoryVM>(_mapper.ConfigurationProvider)
                .ToListAsync();

            return unpaidHistory;
        }

        public async Task<List<PaidCourseHistoryVM>> GetPaidHistoryForParentAsync(int parentUserId)
        {
            var paidHistory = await _context.CoursePayments
                .Where(cp => cp.PaidById == parentUserId && cp.IsPaid == true)
                .OrderByDescending(cp => cp.PaidAt) // Sắp xếp theo ngày giảm dần
                .ThenByDescending(cp => cp.Id)     // Nếu cùng ngày thì Id giảm dần
                .ProjectTo<PaidCourseHistoryVM>(_mapper.ConfigurationProvider)
                .ToListAsync();

            return paidHistory;
        }
    }
}
