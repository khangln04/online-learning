using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;
using System.IO;

public class AllowedExtensionsAttribute : ValidationAttribute
{
    private readonly string[] _extensions;
    private readonly string[] _mimeTypes = {
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    };

    public AllowedExtensionsAttribute(string[] extensions)
    {
        _extensions = extensions;
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is IFormFile file)
        {
            return ValidateFile(file);
        }
        else if (value is IEnumerable<IFormFile> files)
        {
            foreach (var f in files)
            {
                var result = ValidateFile(f);
                if (result != ValidationResult.Success)
                    return result;
            }
        }

        return ValidationResult.Success;
    }

    private ValidationResult? ValidateFile(IFormFile file)
    {
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!_extensions.Contains(ext))
            return new ValidationResult($"❌ File '{file.FileName}' không được chấp nhận. Định dạng cho phép: {string.Join(", ", _extensions)}");

        if (!_mimeTypes.Contains(file.ContentType))
            return new ValidationResult($"❌ File '{file.FileName}' không đúng mime-type cho phép.");

        if (file.Length > 10 * 1024 * 1024)
            return new ValidationResult($"❌ File '{file.FileName}' vượt quá giới hạn 10MB.");

        return ValidationResult.Success;
    }
}
