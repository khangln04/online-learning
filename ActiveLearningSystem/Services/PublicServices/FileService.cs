namespace ActiveLearningSystem.Services.PublicServices
{
    public class FileService : IFileService
    {
        private readonly IWebHostEnvironment _env;

        public FileService(IWebHostEnvironment env)
        {
            _env = env;
        }

        public async Task<string> UploadImageAsync(IFormFile file, string folderName)
        {
            // Kiểm tra định dạng file
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(fileExtension))
            {
                throw new Exception("Chỉ cho phép các định dạng ảnh: JPG, JPEG, PNG.");
            }

            var uploadsFolder = Path.Combine(_env.WebRootPath, folderName);

            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // Để tránh trùng tên, có thể thêm Guid
            var fileName = $"{Guid.NewGuid()}{fileExtension}";

            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            // Trả về path tương đối để lưu DB
            return $"/{folderName}/{fileName}";
        }

        public bool DeleteImage(string relativePath)
        {
            var filePath = Path.Combine(_env.WebRootPath, relativePath.TrimStart('/'));
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                return true;
            }
            return false;
        }
    }
}
