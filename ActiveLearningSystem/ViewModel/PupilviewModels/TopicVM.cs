using ActiveLearningSystem.Model;
using System.Text.Json.Serialization;

namespace ActiveLearningSystem.ViewModel.PupilviewModels
{
    public class TopicVM
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public DateOnly CreatedDate { get; set; }
        public DateOnly? UpdatedDate { get; set; }
        public int? ClassId { get; set; }
        public string? ClassName { get; set; }
        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }
        [JsonIgnore] // Ngăn chu kỳ tham chiếu
        public virtual ICollection<QuizzTopic> QuizzTopics { get; set; } = new List<QuizzTopic>();
    }
}