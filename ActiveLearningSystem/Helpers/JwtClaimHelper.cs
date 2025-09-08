using System.Security.Claims;

namespace ActiveLearningSystem.Helpers
{
    public static class JwtClaimHelper
    {
        public static int GetAccountId(ClaimsPrincipal user)
        {
            var idClaim = user.FindFirst("id")?.Value;
            return int.TryParse(idClaim, out var id)
                ? id
                : throw new Exception("❌ Claim 'id' không hợp lệ hoặc không tồn tại.");
        }

        public static string GetRole(ClaimsPrincipal user)
        {
            return user.FindFirst(ClaimTypes.Role)?.Value ?? "Unknown";
        }
    }
}
