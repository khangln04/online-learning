using ActiveLearningSystem.ViewModel.MaketerViewModels;
using ActiveLearningSystem.ViewModel.PublicViewModels;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ActiveLearningSystem.Services.MarketerServices
{
    public interface IBlogListService
    {
        List<BlogVM> GetAllBlog(int pageNumber, int pageSize, string searchTerm = null, string sortOrder = "desc");
        List<BlogVM> GetBlogDetail(int blogId);
        List<BlogSummaryVM> GetActiveBlogSummaries();
        Task<bool> UpdateBlogAsync(int blogId, BlogUpdateVM blogVM, IFormFile? newThumbnail, int accountId);
        Task<bool> CreateBlogAsync(BlogCreateVM blogVM, IFormFile thumbnail, int accountId);
        Task<bool> DeleteBlogAsync(int blogId);
    }
}
