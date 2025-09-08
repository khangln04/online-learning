using System.ComponentModel.DataAnnotations;

namespace ActiveLearningSystem.ViewModel.MaketerViewModels
{
    public class ReportDetailVM
    {
        public int Id { get; set; }
        public string Title { get; set; } = null!;
        public DateTime CreatedDate { get; set; }
        public string UserName { get; set; } = null!;
        public string ReceiverName { get; set; } = null!;
        public string StatusName { get; set; } = null!;
        public DateTime? LastStatusUpdated { get; set; }
        public string? ContentDetail { get; set; }
        public List<string> FileNames { get; set; } = new();
        public List<ReportStatusVM> ListStatus { get; set; } = new();
        public List<CommentReportVM> Comments { get; set; } = new();
        public bool CanReject { get; set; }
        public bool CanApprove { get; set; }
        public bool CanProcess { get; set; }
        public bool CanCreate { get; set; }
        public bool CanReview { get; set; }
        public bool CanDone { get; set; }
        public bool CanPublish { get; set; }
        public List<ManagerDropdownVM> AvailableInstructors { get; set; } = new();
    }
}