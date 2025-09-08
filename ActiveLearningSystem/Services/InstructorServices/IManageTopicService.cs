using ActiveLearningSystem.ViewModel.InstructorViewModels;

namespace ActiveLearningSystem.Services.InstructorServices
{
    public interface IManageTopicService
    {
        Task<List<TopicListVM>> GetAllTopicsAsync();
        Task<bool> UpdateTopicAsync(int id, TopicCreateUpdateVM model);
        Task CreateTopicAsync(TopicCreateUpdateVM model);
    }
}
