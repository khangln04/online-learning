namespace ActiveLearningSystem.ViewModel.AdminViewModels
{
    public class AccountDetailsVM
    {
        public int AccountId { get; set; }
        public int ProfileId { get; set; }
        public string Name { get; set; } = null!;
        public string Address { get; set; } = null!;
        public DateOnly Dob { get; set; }
        public string Sex { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string Avatar { get; set; } = null!;
        public string RoleName { get; set; } = null!;
    }
}
