using ActiveLearningSystem.ViewModel.MaketerViewModels;

namespace ActiveLearningSystem.Services.MarketerServices
{
    public interface IReportService
    {
        Task<(bool Success, string Message)> CreateReportAsync(CreateReportVM vm, int userId);
        Task<List<ManagerDropdownVM>> GetAllManagersAsync();
        Task<List<ManagerDropdownVM>> GetAllInstructorsAsync();
        Task<List<ReportListItemVM>> GetMyReportsAsync(int userId);
        Task<ReportDetailVM> GetReportDetailAsync(int reportId, int userId);
        Task<(bool Success, string NewStatusName)> UpdateReportStatusAsync(int reportId, UpdateStatusVM vm, int accountId);
        Task<(bool Success, int CommentId)> AddCommentAsync(int reportId, CreateCommentVM vm, int accountId);
        Task<Stream> DownloadReportFilesAsync(int reportId, int accountId);
    }
}
