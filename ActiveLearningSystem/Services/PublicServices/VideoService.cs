using Amazon.S3;
using Amazon.S3.Model;
using ActiveLearningSystem.Services.PublicServices;

public class VideoService : IVideoService
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;

    public VideoService(IAmazonS3 s3Client, string bucketName)
    {
        _s3Client = s3Client;
        _bucketName = bucketName;
    }

    public string GenerateSignedUrl(string fileName, int expirationInMinutes)
    {
        var folder = "1"; // Sử dụng folder mặc định là "1"

        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = $"{folder}/{fileName}",
            Expires = DateTime.UtcNow.AddMinutes(expirationInMinutes)
        };

        return _s3Client.GetPreSignedURL(request);
    }
}