namespace ActiveLearningSystem.ViewModel.PupilviewModels
{
    public class UpdateUserAnswersDTO
    {
        public List<AnswerUpdate> Answers { get; set; } // Danh sách các câu trả lời cập nhật

        public class AnswerUpdate
        {
            public int QuestionId { get; set; } // ID của câu hỏi
            public int? SelectedAnswerId { get; set; } // ID của câu trả lời đã chọn
        }
    }
}
