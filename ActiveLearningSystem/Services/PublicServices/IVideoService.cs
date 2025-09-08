namespace ActiveLearningSystem.Services.PublicServices
{
    public interface IVideoService
    {
        string GenerateSignedUrl(string fileName, int expireMinutes = 120);
    }
}