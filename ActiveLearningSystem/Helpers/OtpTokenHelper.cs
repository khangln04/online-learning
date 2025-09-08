using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace ActiveLearningSystem.Helpers
{
    public static class OtpTokenHelper
    {
        public static string CreateOtpToken<T>(T payload, string otp, string issuer, string key)
        {
            var handler = new JwtSecurityTokenHandler();
            var token = handler.CreateJwtSecurityToken(
                issuer: issuer,
                audience: null,
                subject: new ClaimsIdentity(new[]
                {
                    new Claim("payload", JsonSerializer.Serialize(payload)),
                    new Claim("otp", otp)
                }),
                notBefore: DateTime.UtcNow,
                expires: DateTime.UtcNow.AddMinutes(5),
                signingCredentials: new SigningCredentials(
                    new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                    SecurityAlgorithms.HmacSha256)
            );
            return handler.WriteToken(token);
        }

        public static T DecodeOtpToken<T>(string token, out string otp, out DateTime expiredAt)
        {
            var handler = new JwtSecurityTokenHandler();

            if (token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                token = token.Substring(7).Trim();

            try
            {
                var jwt = handler.ReadJwtToken(token);
                var payloadJson = jwt.Claims.First(c => c.Type == "payload").Value;
                otp = jwt.Claims.First(c => c.Type == "otp").Value;
                expiredAt = jwt.ValidTo;

                return JsonSerializer.Deserialize<T>(payloadJson)!;
            }
            catch (Exception ex)
            {
                throw new Exception("🔥 DecodeOtpToken bị gọi sai! Token: " + token, ex);
            }
        }
    }
}
