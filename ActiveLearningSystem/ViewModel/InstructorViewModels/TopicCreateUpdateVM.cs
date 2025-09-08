using System.ComponentModel.DataAnnotations;

public class TopicCreateUpdateVM
{
    [Required(ErrorMessage = "Tên topic không được để trống.")]
    public string Name { get; set; } = null!;

    [Required(ErrorMessage = "ClassId không được để trống.")]
    public int ClassId { get; set; }

    [Required(ErrorMessage = "CategoryId không được để trống.")]
    public int CategoryId { get; set; }
}
