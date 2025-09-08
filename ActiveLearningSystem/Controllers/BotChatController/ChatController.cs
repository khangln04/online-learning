using ActiveLearningSystem.Services.BotChatServices;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

[Route("api/[controller]")]
[ApiController]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService)
    {
        _chatService = chatService;
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] ChatRequest request)
    {
        var reply = await _chatService.SendMessageAsync(request.Message);
        return Ok(new { reply });
    }
}

public class ChatRequest
{
    public string Message { get; set; } = string.Empty;
}

