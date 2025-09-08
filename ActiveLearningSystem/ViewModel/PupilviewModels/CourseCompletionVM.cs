namespace ActiveLearningSystem.ViewModel.PupilviewModels
{
    public class CourseCompletionVM
    {
        public int CourseId { get; set; }
        public string CourseName { get; set; }
        public string Description { get; set; }
        public string Image { get; set; }
        public int CourseProgressId { get; set; }
        public int TotalModules { get; set; }
        public DateOnly? StartDate { get; set; }
        public DateOnly? LastAccess { get; set; }
        public bool Status { get; set; }
        public List<ModuleCompletionVM> ModuleCompletionVMs { get; set; }

    }
    public class QuizzCompletionVM
    {
        public int Id { get; set; }
        public int UserQuizzId { get; set; }
        public string Title { get; set; } = null!;
        public string Description { get; set; }
        public int QuestionCount { get; set; }
        public int? TimeLimit { get; set; }
        public double? RequiredScore { get; set; }

        // ✅ Thông tin từ UserQuizz
        public DateTime? StartAt { get; set; }
        public DateTime? SubmitAt { get; set; }
        public double? Duration { get; set; }
        public double? Score { get; set; }
        public bool? IsPass { get; set; }
        public List<QuizzQuestionCompletionVM> Questions { get; set; } = new();
    }



    public class QuizzQuestionCompletionVM
    {
        public int Id { get; set; }
        public string QuestionContent { get; set; } = null!;
        public List<QuizzAnswerCompletionVM> Answers { get; set; } = new();
    }


    public class QuizzAnswerCompletionVM
    {
        public int Id { get; set; }
        public string AnswerContent { get; set; } = null!;
        public bool IsCorrect { get; set; }

        public bool IsSelected { get; set; } // ✅ Thêm để đánh dấu đáp án được chọn
    }


    public class LessonCompletionVM
    {
        public int Id { get; set; }
        public string Title { get; set; } = null!;
        public int? LessonProgressId { get; set; }
        public bool Status { get; set; }
        public string Link { get; set; }

        public string Description { get; set; } = null!;

        public int VideoNum { get; set; }
        public DateOnly? LastWatch { get; set; }
        public string? SecuredVideoLink { get; set; }
    }
    public class ModuleCompletionVM
    {
        public int Id { get; set; }

        public string ModuleName { get; set; } = null!;

        public string Description { get; set; } = null!;

        public int ModuleNum { get; set; }
        public int ModuleProgressID { get; set; }
        public int TotalLessons { get; set; }
        public DateOnly? StartDate { get; set; }
        public DateOnly? LastAccess { get; set; }
        public bool Status { get; set; }
        public List<LessonCompletionVM> Lessons { get; set; }
        public List<QuizzCompletionVM> Quizzs { get; set; }
    }

    public class LessonWatchUpdateVM
    {
        public int LessonProgressId { get; set; }
        public double WatchedSeconds { get; set; }
    }
}