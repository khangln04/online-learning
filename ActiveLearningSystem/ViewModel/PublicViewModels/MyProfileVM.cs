namespace ActiveLearningSystem.ViewModel.PublicViewModels
{
    public class MyProfileVM

    {
        public int UserId { get; set; }
        public string Name { get; set; }
        public string Address { get; set; }
        public DateOnly Dob { get; set; }
        public string Sex { get; set; } // "Nam" | "Nữ"
        public string Phone { get; set; }
        public string Email { get; set; }
        public string Avatar { get; set; }
        public string RoleName { get; set; }

        // Dành cho role Pupil: 1 email của cha mẹ
        public string? LinkedParentEmail { get; set; }

        // Dành cho role Parent: danh sách email con
        public List<string>? LinkedChildrenEmails { get; set; }
    }

    public class LinkAccountVM
    {
        public string Email { get; set; }
    }
}
