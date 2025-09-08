using ActiveLearningSystem.Model;
using ActiveLearningSystem.ViewModel.PublicViewModels;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ActiveLearningSystem.Services.PublicServices
{
    public class PublicService : IPublicService
    {
        private readonly AlsContext _context;
        private readonly IMapper _mapper;

        public PublicService(AlsContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public List<BannerVM> GetActiveBanner()
        {
            var blogs = _context.Blogs
                .Where(b => b.Status) 
                .OrderByDescending(b => b.CreatedDate) 
                .ToList();

            return _mapper.Map<List<BannerVM>>(blogs);
        }
        public List<FeedbackVM> GetAllFeedbacks()
        {
            var feedbacks = _context.Feedbacks
                .Include(f => f.Author)
                .Include(f => f.Course)
                .Where(f => f.Status == true)
                .OrderByDescending(f => f.CreatedDate)
                .ToList();

            return _mapper.Map<List<FeedbackVM>>(feedbacks);
        }
    }
}
