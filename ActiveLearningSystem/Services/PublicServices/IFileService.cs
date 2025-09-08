namespace ActiveLearningSystem.Services.PublicServices
{
    public interface IFileService
    {
        Task<string> UploadImageAsync(IFormFile file, string folderName);
        bool DeleteImage(string relativePath);
    }

}
