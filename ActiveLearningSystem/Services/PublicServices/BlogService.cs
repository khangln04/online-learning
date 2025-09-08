using ActiveLearningSystem.Model;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.Linq;
using ActiveLearningSystem.ViewModel.PublicViewModels;
using ActiveLearningSystem.ViewModel.MaketerViewModels;
using ActiveLearningSystem.Services.PublicServices;

namespace ActiveLearningSystem.Services.MarketerServices
{
    public class BlogService : IBlogService
    {
        private readonly AlsContext _context;
        private readonly IMapper _mapper;
        private readonly IFileService _fileService;
        public BlogService(AlsContext context, IMapper mapper, IFileService fileService)
        {
            _context = context;
            _mapper = mapper;
            _fileService = fileService;
        }

        private IQueryable<Blog> GetBlogsQuery(string searchTerm = null, string sortOrder = "newest")
        {
            var query = _context.Blogs
                .Include(x => x.Author)
                .Where(s => s.Status == true);

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
                query = query.OrderByDescending(b => b.CreatedDate).ThenByDescending(b => b.Id);
            }

            return query;
        }

        public List<BlogVM> GetAllBlog(int pageNumber, int pageSize, string searchTerm = null, string sortOrder = "newest")
        {
            var query = GetBlogsQuery(searchTerm, sortOrder);
            var paginatedBlogs = query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();
            return _mapper.Map<List<BlogVM>>(paginatedBlogs);
        }

        public BlogVM? GetBlogDetail(int blogId)
        {
            var blog = _context.Blogs
                .Include(b => b.Author)
                .Include(b => b.Comments.OrderByDescending(c => c.CreatedDate).ThenByDescending(c => c.Id))
                    .ThenInclude(c => c.Author)
                .FirstOrDefault(b => b.Id == blogId);

            if (blog == null) return null;

            return _mapper.Map<BlogVM>(blog);
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
       

        public List<BlogVM> GetTop3NewestBlogs()
        {
            var newestBlogs = _context.Blogs
                .Include(b => b.Author)
                .Where(b => b.Status == true)
                .OrderByDescending(b => b.CreatedDate)
                .ThenByDescending(b => b.Id)
                .Take(3)
                .ToList();

            return _mapper.Map<List<BlogVM>>(newestBlogs);
        }

        public async Task<bool> AddCommentAsync(int blogId, int authorId, string content)
        {
            bool blogExists = await _context.Blogs.AnyAsync(b => b.Id == blogId);
            if (!blogExists)
            {
                return false;
            }

            var comment = new Comment
            {
                BlogId = blogId,
                AuthorId = authorId,
                Content = content,
                CreatedDate = DateOnly.FromDateTime(DateTime.UtcNow),
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();
            return true;
        }

    }
}