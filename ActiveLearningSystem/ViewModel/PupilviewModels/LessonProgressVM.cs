namespace ActiveLearningSystem.ViewModel.PupilviewModels
{
    public class LessonProgressVM
    {
        public int LessonId { get; set; }
        public string LessonName { get; set; } = null!;
         public DateOnly? LastWatched { get; set; }
        public bool IsCompleted { get; set; }
    }

}
