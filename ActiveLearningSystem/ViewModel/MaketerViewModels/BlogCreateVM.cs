using System.ComponentModel.DataAnnotations;

public class BlogCreateVM
{
    [Required(ErrorMessage = "Tiêu đề không được để trống")]
    public string Title { get; set; } = null!;

    [Required(ErrorMessage = "Nội dung không được để trống")]
    public string Content { get; set; } = null!;

    [Required(ErrorMessage = "Tóm tắt không được để trống")]
    public string Summary { get; set; } = null!;

    public bool Status { get; set; }
}
