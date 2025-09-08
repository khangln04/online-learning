using ActiveLearningSystem.ViewModel.AuthenViewModels;

namespace ActiveLearningSystem.Services.AuthenServices
{
    public interface IAccountService
    {
        Task<string> PreRegisterAsync(CreateAccountVM model);
        Task<bool> VerifyAndCreateAccountAsync(string token, string otp);
        Task<bool> RequestResetPasswordAsync(string email);
        Task<bool> ResetPasswordAsync(string token, string newPassword);
        Task<bool> ChangePasswordAsync(ChangePasswordVM model, int accountId);
        Task<string> ResendOtpAsync(ResendOtpVM model);
    }
}
