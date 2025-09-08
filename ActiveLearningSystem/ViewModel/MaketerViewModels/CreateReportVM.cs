using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;

namespace ActiveLearningSystem.ViewModel.MaketerViewModels
{
    public class CreateReportVM
    {
        [Required]
        public string Title { get; set; } = null!;

        [Required]
        public string ReceiverName { get; set; } = null!;

        [Required]
        public string ContentDetail { get; set; } = null!;

        [Required]
        [AllowedExtensions(new[] { ".pdf", ".doc", ".docx", ".xlsx", ".xls", ".ppt", ".pptx" })]
        public List<IFormFile> Files { get; set; } = new();
    }
}
