using ActiveLearningSystem.ViewModel.AdminViewModels;

namespace ActiveLearningSystem.Services.AdminServices
{
    public interface IAccountListService
    {
        List<AccountVM> GetAccounts(int page, int pageSize, string? search, bool? status);
        void UpdateAccountStatus(int accountId, bool status);
        AccountDetailsVM? GetAccountDetailsById(int accountId);
        void CreateAccountByAdmin(CreateAccount model);
        List<RoleDropdownVM> GetValidRoles();
    }
}
