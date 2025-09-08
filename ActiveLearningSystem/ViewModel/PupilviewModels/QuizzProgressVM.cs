namespace ActiveLearningSystem.ViewModel.PupilviewModels
{
    public class QuizzProgressVM
    {
      
            public int Id { get; set; }
            public int UserQuizzId { get; set; }
            public string Title { get; set; } = null!;
            public string Description { get; set; }
            public int QuestionCount { get; set; }
            public int? TimeLimit { get; set; }
            public double? RequiredScore { get; set; }

            public DateTime? StartAt { get; set; }
            public DateTime? SubmitAt { get; set; }
            public double? Duration { get; set; }
            public double? Score { get; set; }
            public bool? IsPass { get; set; }
        
    }
}
