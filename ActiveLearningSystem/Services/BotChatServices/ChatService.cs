using ActiveLearningSystem.Services.BotChatServices;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

public class ChatService : IChatService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _knowledgeBasePath;

    public ChatService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClient = httpClientFactory.CreateClient();
        _apiKey = configuration["OpenAI:ApiKey"];
        // Đường dẫn tới file kiến thức (có thể đặt trong appsettings.json để dễ config)
        _knowledgeBasePath = Path.Combine(AppContext.BaseDirectory, "Data", "ALS_Knowledge.txt");
    }

    public async Task<string> SendMessageAsync(string userMessage)
    {
        string knowledge = "";
        if (File.Exists(_knowledgeBasePath))
        {
            knowledge = await File.ReadAllTextAsync(_knowledgeBasePath);
        }

        var systemPrompt = $@"
Bạn là trợ lý AI của hệ thống Active Learning System.
Dưới đây là kiến thức nội bộ, hãy dùng để trả lời người dùng:
{knowledge}
";

        var requestBody = new
        {
            model = "gpt-3.5-turbo",
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userMessage }
            }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new Exception($"Lỗi gọi OpenAI: {response.StatusCode} - {error}");
        }

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        return doc.RootElement
                  .GetProperty("choices")[0]
                  .GetProperty("message")
                  .GetProperty("content")
                  .GetString() ?? "";
    }
}
