namespace ActiveLearningSystem.ViewModel.PublicViewModels
{
    public class PaginationParams
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 5;
        public string SearchTerm { get; set; }
        public string SortOrder { get; set; } = "desc";
    }
}
