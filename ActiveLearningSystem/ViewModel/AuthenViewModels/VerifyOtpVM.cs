namespace ActiveLearningSystem.ViewModel.AuthenViewModels
{
    public class VerifyOtpVM
    {
        public string Token { get; set; }  // JWT chứa CreateAccountVM
        public string Otp { get; set; }
    }
}