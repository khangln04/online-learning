namespace ActiveLearningSystem.ViewModel.AdminViewModels
{
    public class AccountVM
    {
        public int Id { get; set; }
        public string Username { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Role { get; set; } = null!;
        public bool Status { get; set; }
        public DateOnly CreatedDate { get; set; }
        public DateOnly? UpdatedDate { get; set; }

    }
}
