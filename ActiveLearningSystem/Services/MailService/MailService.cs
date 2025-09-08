using ActiveLearningSystem.Services.MailService;
using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;

public class MailService : IMailService
{
    private readonly IConfiguration _config;

    public MailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        var host = _config["MailSettings:Host"];
        var port = int.Parse(_config["MailSettings:Port"]);
        var username = _config["MailSettings:Username"];
        var password = _config["MailSettings:Password"];
        var from = _config["MailSettings:From"];
        var displayName = _config["MailSettings:DisplayName"];

        var client = new SmtpClient(host, port)
        {
            Credentials = new NetworkCredential(username, password),
            EnableSsl = true,
            Timeout = 10000 // Timeout 10 giây
        };

        var message = new MailMessage
        {
            From = new MailAddress(from, displayName),
            Subject = subject,
            Body = body,
            IsBodyHtml = true
        };
        message.To.Add(to);

        try
        {
            await client.SendMailAsync(message);
        }
        catch (SmtpException ex)
        {
            throw; // Ném lỗi để service gọi xử lý
        }
        catch (Exception ex)
        {
            throw new SmtpException("Lỗi kết nối đến máy chủ email.", ex);
        }
    }
}