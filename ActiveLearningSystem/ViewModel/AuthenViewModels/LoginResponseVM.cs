namespace ActiveLearningSystem.ViewModel.AuthenViewModels
{
    public class LoginResponseVM
    {
        public string Username { get; set; }
        public string Name { get; set; }         // Tên từ Profile
        public string Avatar { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }         // Tên role (Admin, Student,...)
        public bool Success { get; set; }
        public string Message { get; set; }
        public string Token { get; set; }

    }
}
