//using ActiveLearningSystem.Controllers.InstructorController;
//using ActiveLearningSystem.Services.InstructorServices;
//using ActiveLearningSystem.ViewModel;
//using ActiveLearningSystem.ViewModel.InstructorViewModels;
//using ActiveLearningSystem.ViewModel.PublicViewModels;
//using Microsoft.AspNetCore.Http;
//using Microsoft.AspNetCore.Mvc;
//using Moq;
//using System;
//using System.Collections.Generic;
//using System.IO;
//using System.Security.Claims;
//using System.Threading.Tasks;
//using Xunit;

//public class ManageCourseControllerTests
//{
//    private readonly Mock<ICourseListService> _mockCourseService;
//    private readonly ManageCourseController _controller;

//    public ManageCourseControllerTests()
//    {
//        _mockCourseService = new Mock<ICourseListService>();
//        _controller = new ManageCourseController(_mockCourseService.Object)
//        {
//            ControllerContext = new ControllerContext()
//        };
//    }

//    private void SetUserWithRoleId(int accountId, int roleId)
//    {
//        var claims = new List<Claim>
//        {
//            new Claim("AccountId", accountId.ToString()),
//            new Claim("RoleId", roleId.ToString())
//        };
//        var identity = new ClaimsIdentity(claims, "mock");
//        _controller.ControllerContext.HttpContext = new DefaultHttpContext
//        {
//            User = new ClaimsPrincipal(identity)
//        };
//    }

//    private static IFormFile CreateMockImage(string fileName = "26a.jpg")
//    {
//        var fileMock = new Mock<IFormFile>();
//        var content = "Fake image content";
//        var ms = new MemoryStream();
//        var writer = new StreamWriter(ms);
//        writer.Write(content);
//        writer.Flush();
//        ms.Position = 0;

//        fileMock.Setup(f => f.FileName).Returns(fileName);
//        fileMock.Setup(f => f.Length).Returns(ms.Length);
//        fileMock.Setup(f => f.OpenReadStream()).Returns(ms);
//        fileMock.Setup(f => f.ContentType).Returns("image/jpeg");
//        return fileMock.Object;
//    }

//    [Theory(DisplayName = "UTCID01 - Manager hoặc Marketer lấy tất cả khóa học")]
//    [InlineData(1)] // Manager
//    [InlineData(2)] // Marketer
//    public void GetCourses_ManagerOrMarketer_ShouldReturnAllCourses(int roleId)
//    {
//        // Arrange
//        SetUserWithRoleId(99, roleId);
//        var expectedCourses = new List<CourseVM>
//        {
//            new CourseVM
//            {
//                CourseId = 1, CourseName = "Manager Course", Description = "Desc", Price = 100,
//                CategoryId = 1, CategoryName = "Cat", ClassName = "Class", AuthorId = 99,
//                AuthorName = "Author", CreatedDate = DateOnly.FromDateTime(DateTime.Today),
//                Status = true, AverageRating = 4.5, Modules = new List<ModuleVM>(), Feedbacks = new List<FeedbackVM>()
//            }
//        };
//        _mockCourseService.Setup(s => s.GetCourses(It.IsAny<int>(), null, null, null, 1))
//                          .Returns((expectedCourses, expectedCourses.Count, 1));

//        // Act
//        var result = _controller.GetCourses();

//        // Assert
//        var ok = Assert.IsType<OkObjectResult>(result);
//        var data = Assert.IsAssignableFrom<IDictionary<string, object>>(ok.Value);
//        Assert.Equal(expectedCourses, data["Data"]);
//        Assert.Equal(expectedCourses.Count, data["TotalRecords"]);
//    }

//    [Fact(DisplayName = "UTCID02 - Author (Instructor) lấy khóa học theo AuthorId")]
//    public async Task GetCoursesByAuthor_ShouldReturnOnlyAuthorCourses()
//    {
//        // Arrange
//        int authorId = 55;
//        SetUserWithRoleId(authorId, 3); // Instructor
//        var expectedCourses = new List<CourseVM>
//        {
//            new CourseVM
//            {
//                CourseId = 2, CourseName = "Author Course", Description = "Desc", Price = 150,
//                CategoryId = 1, CategoryName = "Cat", ClassName = "Class", AuthorId = authorId,
//                AuthorName = "Author Name", CreatedDate = DateOnly.FromDateTime(DateTime.Today),
//                Status = true, AverageRating = 4.0, Modules = new List<ModuleVM>(), Feedbacks = new List<FeedbackVM>()
//            }
//        };
//        _mockCourseService.Setup(s => s.GetCoursesById(authorId, 1, null, null, null, 1))
//                          .ReturnsAsync((expectedCourses, expectedCourses.Count, 1));

//        // Act
//        var result = await _controller.GetCoursesByAuthor();

//        // Assert
//        var ok = Assert.IsType<OkObjectResult>(result);
//        var data = Assert.IsAssignableFrom<IDictionary<string, object>>(ok.Value);
//        Assert.Equal(expectedCourses, data["Data"]);
//        Assert.Equal(1, data["TotalRecords"]);
//    }

//    [Fact(DisplayName = "UTCID03 - GetCourseDetail trả về NotFound khi không tìm thấy")]
//    public void GetCourseDetail_ReturnsNotFound_WhenCourseNull()
//    {
//        // Arrange
//        _mockCourseService.Setup(s => s.GetCourseDetail(It.IsAny<int>()))
//                          .Returns((CourseVM)null);

//        // Act
//        var result = _controller.GetCourseDetail(999);

//        // Assert
//        var notFound = Assert.IsType<NotFoundObjectResult>(result);
//        var data = Assert.IsAssignableFrom<IDictionary<string, object>>(notFound.Value);
//        Assert.Equal("Không tìm thấy khóa học.", data["message"]);
//    }

//    [Fact(DisplayName = "UTCID04 - CreateCourse thành công")]
//    public async Task CreateCourse_ReturnsOk()
//    {
//        // Arrange
//        int accountId = 55;
//        SetUserWithRoleId(accountId, 3); // Instructor
//        var courseCreateVM = new CourseCreateVM
//        {
//            CourseName = "New Course",
//            Description = "Description",
//            Price = 100,
//            CategoryId = 1,
//            ClassId = 1
//        };
//        var mockImage = CreateMockImage();
//        _mockCourseService.Setup(s => s.CreateCourseAsync(courseCreateVM, mockImage, accountId))
//                          .ReturnsAsync(true);

//        // Act
//        var result = await _controller.CreateCourse(courseCreateVM, mockImage);

//        // Assert
//        var ok = Assert.IsType<OkObjectResult>(result);
//        var data = Assert.IsAssignableFrom<IDictionary<string, object>>(ok.Value);
//        Assert.Equal("Tạo khóa học thành công!", data["message"]);
//    }

//    [Fact(DisplayName = "UTCID05 - UpdateCourse thành công")]
//    public async Task UpdateCourse_ReturnsOk()
//    {
//        // Arrange
//        int accountId = 55;
//        SetUserWithRoleId(accountId, 3);
//        var courseUpdateVM = new CourseUpdateVM
//        {
//            CourseName = "Updated Course",
//            Description = "Description",
//            Price = 200,
//            CategoryId = 1,
//            ClassId = 1
//        };
//        var mockImage = CreateMockImage();
//        _mockCourseService.Setup(s => s.UpdateCourseAsync(1, courseUpdateVM, mockImage, accountId))
//                          .ReturnsAsync(true);

//        // Act
//        var result = await _controller.UpdateCourse(1, courseUpdateVM, mockImage);

//        // Assert
//        var ok = Assert.IsType<OkObjectResult>(result);
//        var data = Assert.IsAssignableFrom<IDictionary<string, object>>(ok.Value);
//        Assert.Contains("Cập nhật khóa học thành công", data["message"].ToString());
//    }

//    [Fact(DisplayName = "UTCID06 - SetCourseStatus thành công")]
//    public async Task SetCourseStatus_ReturnsOk()
//    {
//        // Arrange
//        SetUserWithRoleId(1, 1);
//        _mockCourseService.Setup(s => s.SetCourseStatusAsync(1, true))
//                          .ReturnsAsync(true);

//        // Act
//        var result = await _controller.SetCourseStatus(1, true);

//        // Assert
//        var ok = Assert.IsType<OkObjectResult>(result);
//        var data = Assert.IsAssignableFrom<IDictionary<string, object>>(ok.Value);
//        Assert.Contains("Cập nhật trạng thái khóa học thành công", data["message"].ToString());
//    }

//    [Fact(DisplayName = "UTCID07 - GetClassDropdown thành công")]
//    public void GetClassDropdown_ReturnsOk()
//    {
//        // Arrange
//        var expectedClasses = new List<ClassVM> { new ClassVM { Id = 1, Name = "Class1" } };
//        _mockCourseService.Setup(s => s.GetClassDropdown()).Returns(expectedClasses);

//        // Act
//        var result = _controller.GetClassDropdown();

//        // Assert
//        var ok = Assert.IsType<OkObjectResult>(result);
//        Assert.Equal(expectedClasses, ok.Value);
//    }

//    [Fact(DisplayName = "UTCID08 - GetCategoryDropdown thành công")]
//    public void GetCategoryDropdown_ReturnsOk()
//    {
//        // Arrange
//        var expectedCategories = new List<CategoryVM> { new CategoryVM { Id = 1, Name = "Category1" } };
//        _mockCourseService.Setup(s => s.GetCategoryDropdown()).Returns(expectedCategories);

//        // Act
//        var result = _controller.GetCategoryDropdown();

//        // Assert
//        var ok = Assert.IsType<OkObjectResult>(result);
//        Assert.Equal(expectedCategories, ok.Value);
//    }
//}
