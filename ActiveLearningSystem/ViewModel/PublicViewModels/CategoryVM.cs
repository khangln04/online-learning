namespace ActiveLearningSystem.ViewModel.PublicViewModels
{
    public class CategoryVM
    {
        public int Id { get; set; }

        public string Name { get; set; } = null!;

        public DateOnly? CreatedDate { get; set; }

        public DateOnly? UpdatedDate { get; set; }

        public bool? Status { get; set; }
    }
}
