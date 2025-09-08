using ActiveLearningSystem.ViewModel.AuthenViewModels;

namespace ActiveLearningSystem.Services.AuthenServices
{
    public interface IAuthService
    {
        LoginResponseVM Login(LoginVM login);
    }
}
