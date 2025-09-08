using ActiveLearningSystem.ViewModel.MaketerViewModels;
using ActiveLearningSystem.ViewModel.PublicViewModels;

namespace ActiveLearningSystem.Services.PublicServices
{
    public interface  IBlogService
    {
        List<BlogVM> GetAllBlog(int pageNumber, int pageSize, string searchTerm = null, string sortOrder = "desc");
        BlogVM? GetBlogDetail(int blogId);
        List<BlogSummaryVM> GetActiveBlogSummaries();
        List<BlogVM> GetTop3NewestBlogs();
        Task<bool> AddCommentAsync(int blogId, int authorId, string content);
    }
}
