using ActiveLearningSystem.Model;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.Linq;
using ActiveLearningSystem.ViewModel.PublicViewModels;
using ActiveLearningSystem.ViewModel.MaketerViewModels;
using ActiveLearningSystem.Services.PublicServices;
using Microsoft.Identity.Client;
using ActiveLearningSystem.ViewModel.AdminViewModels;

namespace ActiveLearningSystem.Services.MarketerServices
{
    public class BlogListService : IBlogListService
    {
        private readonly AlsContext _context;
        private readonly IMapper _mapper;
        private readonly IFileService _fileService;
        private const int ROLE_MARKERTER = 3;
        public BlogListService(AlsContext context, IMapper mapper, IFileService fileService)
        {
            _context = context;
            _mapper = mapper;
            _fileService = fileService;
        }

        private IQueryable<Blog> GetBlogsQuery(string searchTerm = null, string sortOrder = "newest")
        {
            IQueryable<Blog> query = _context.Blogs
                .Include(x => x.Author);

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(b => b.Title.Contains(searchTerm));
            }

            if (sortOrder.ToLower() == "oldest")
            {
                query = query.OrderBy(b => b.CreatedDate);
            }
            else
            {
                query = query.OrderByDescending(b => b.CreatedDate);
            }

            return query;
        }



        public List<BlogVM> GetAllBlog(int pageNumber, int pageSize, string searchTerm = null, string sortOrder = "newest")
        {
            var query = GetBlogsQuery(searchTerm, sortOrder);
            var paginatedBlogs = query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();
            return _mapper.Map<List<BlogVM>>(paginatedBlogs);
        }

        public List<BlogVM> GetBlogDetail(int blogId)
        {
            var blog = _context.Blogs
                .Include(x => x.Author)
                .Where(s => s.Id == blogId)
                .ToList();

            return _mapper.Map<List<BlogVM>>(blog);
        }

        public List<BlogSummaryVM> GetActiveBlogSummaries()
        {
            var blogs = _context.Blogs
                .Include(b => b.Author)
                .Where(b => b.Status == true)
                .OrderByDescending(b => b.CreatedDate)
                .ThenByDescending(b => b.Id)
                .ToList();

            return _mapper.Map<List<BlogSummaryVM>>(blogs);
        }
        public async Task<bool> UpdateBlogAsync(int blogId, BlogUpdateVM blogVM, IFormFile? newThumbnail, int accountId)
        {
            var user = await _context.Profiles.FirstOrDefaultAsync(p => p.AccountId == accountId);
            int userId = user.UserId;

            var blog = await _context.Blogs.FirstOrDefaultAsync(b => b.Id == blogId);
            if (blog == null)
                throw new Exception("Blog không tồn tại.");

            if (string.IsNullOrWhiteSpace(blogVM.Title))
                throw new Exception("Title không được để trống.");
            if (blogVM.Title.Length > 100)
                throw new Exception("Title không được vượt quá 100 ký tự.");

            if (string.IsNullOrWhiteSpace(blogVM.Content))
                throw new Exception("Content không được để trống.");

            if (string.IsNullOrWhiteSpace(blogVM.Summary))
                throw new Exception("Summary không được để trống.");

            var existingTitle = await _context.Blogs
                .AnyAsync(b => b.Title == blogVM.Title && b.Id != blogId);
            if (existingTitle)
                throw new Exception("Title đã tồn tại, vui lòng chọn Title khác.");

            blog.Title = blogVM.Title;
            blog.Content = blogVM.Content;
            blog.Summary = blogVM.Summary;
            blog.Status = blogVM.Status;
            blog.UpdatedDate = DateOnly.FromDateTime(DateTime.Now);

            if (newThumbnail != null && newThumbnail.Length > 0)
            {
                var newPath = await _fileService.UploadImageAsync(newThumbnail, "blog");

                if (newPath.Length > 200)
                    throw new Exception("Đường dẫn Thumbnail không được vượt quá 200 ký tự.");

                if (!string.IsNullOrEmpty(blog.Thumbnail))
                {
                    _fileService.DeleteImage(blog.Thumbnail);
                }

                blog.Thumbnail = newPath;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CreateBlogAsync(BlogCreateVM blogVM, IFormFile thumbnail, int accountId)
        {
            var user = await _context.Profiles.FirstOrDefaultAsync(p => p.AccountId == accountId);
            int userId = user.UserId;

            if (string.IsNullOrWhiteSpace(blogVM.Title))
                throw new Exception("Title không được để trống.");
            if (blogVM.Title.Length > 100)
                throw new Exception("Title không được vượt quá 100 ký tự.");

            if (string.IsNullOrWhiteSpace(blogVM.Content))
                throw new Exception("Content không được để trống.");

            if (string.IsNullOrWhiteSpace(blogVM.Summary))
                throw new Exception("Summary không được để trống.");

            if (thumbnail == null || thumbnail.Length == 0)
                throw new Exception("Thumbnail không hợp lệ.");

            var existingTitle = await _context.Blogs.AnyAsync(b => b.Title == blogVM.Title);
            if (existingTitle)
                throw new Exception("Title đã tồn tại, vui lòng chọn Title khác.");

            var thumbnailPath = await _fileService.UploadImageAsync(thumbnail, "blog");

            if (thumbnailPath.Length > 200)
                throw new Exception("Đường dẫn Thumbnail không được vượt quá 200 ký tự.");

            var newBlog = new Blog
            {
                Title = blogVM.Title,
                Content = blogVM.Content,
                Summary = blogVM.Summary,
                AuthorId = userId,
                Status = blogVM.Status,
                CreatedDate = DateOnly.FromDateTime(DateTime.Now),
                Thumbnail = thumbnailPath
            };

            _context.Blogs.Add(newBlog);
            await _context.SaveChangesAsync();
            return true;
        }



        public async Task<bool> DeleteBlogAsync(int blogId)
        {
            var blog = await _context.Blogs
                .Include(b => b.Comments)
                .FirstOrDefaultAsync(b => b.Id == blogId);

            if (blog == null)
                return false;

            // Xóa tất cả các bình luận liên quan
            if (blog.Comments != null && blog.Comments.Any())
            {
                _context.Comments.RemoveRange(blog.Comments);
            }

            // Xóa blog
            _context.Blogs.Remove(blog);

            await _context.SaveChangesAsync();
            return true;
        }


    }
}