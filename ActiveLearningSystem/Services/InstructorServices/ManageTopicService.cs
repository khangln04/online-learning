using ActiveLearningSystem.Model;
using ActiveLearningSystem.ViewModel.InstructorViewModels;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using System;

namespace ActiveLearningSystem.Services.InstructorServices
{
    public class ManageTopicService : IManageTopicService
    {
        private readonly AlsContext _context;
        private readonly IMapper _mapper;

        public ManageTopicService(AlsContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<TopicListVM>> GetAllTopicsAsync()
        {
            var topics = await _context.Topics
                .Include(t => t.Class)
                .Include(t => t.Category)
                .OrderByDescending(t => t.CreatedDate)
                .ThenByDescending(t => t.Id)
                .ProjectTo<TopicListVM>(_mapper.ConfigurationProvider)
                .ToListAsync();

            return topics;
        }

        public async Task<bool> UpdateTopicAsync(int id, TopicCreateUpdateVM model)
        {
            // Kiểm tra trùng tên với topic khác
            bool isDuplicate = await _context.Topics
                .AnyAsync(t => t.Name == model.Name && t.Id != id);
            if (isDuplicate)
                throw new Exception("Tên topic đã tồn tại.");

            // Kiểm tra category tồn tại
            bool categoryExists = await _context.Categories
                .AnyAsync(c => c.Id == model.CategoryId);
            if (!categoryExists)
                throw new Exception("Category không tồn tại.");

            // Kiểm tra class tồn tại
            bool classExists = await _context.Classes
                .AnyAsync(cl => cl.Id == model.ClassId);
            if (!classExists)
                throw new Exception("Class không tồn tại.");

            var topic = await _context.Topics.FindAsync(id);
            if (topic == null) return false;

            _mapper.Map(model, topic);
            topic.UpdatedDate = DateOnly.FromDateTime(DateTime.UtcNow);

            _context.Topics.Update(topic);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task CreateTopicAsync(TopicCreateUpdateVM model)
        {
            // Kiểm tra trùng tên
            bool isDuplicate = await _context.Topics
                .AnyAsync(t => t.Name == model.Name);
            if (isDuplicate)
                throw new Exception("Tên topic đã tồn tại.");

            // Kiểm tra category tồn tại
            bool categoryExists = await _context.Categories
                .AnyAsync(c => c.Id == model.CategoryId);
            if (!categoryExists)
                throw new Exception("Category không tồn tại.");

            // Kiểm tra class tồn tại
            bool classExists = await _context.Classes
                .AnyAsync(cl => cl.Id == model.ClassId);
            if (!classExists)
                throw new Exception("Class không tồn tại.");

            var topic = _mapper.Map<Topic>(model);
            topic.CreatedDate = DateOnly.FromDateTime(DateTime.UtcNow);

            _context.Topics.Add(topic);
            await _context.SaveChangesAsync();
        }


    }
}
