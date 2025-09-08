//using ActiveLearningSystem.Model;
//using ActiveLearningSystem.Services.InstructorServices;
//using ActiveLearningSystem.Services.PublicServices;
//using ActiveLearningSystem.ViewModel.AdminViewModels;
//using ActiveLearningSystem.ViewModel.InstructorViewModels;
//using ActiveLearningSystem.ViewModel.PublicViewModels;
//using AutoMapper;
//using Microsoft.AspNetCore.Http;
//using Microsoft.EntityFrameworkCore;
//using Moq;
//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Threading.Tasks;
//using Xunit;

//public class CourseListServiceTests
//{
//    private readonly Mock<IMapper> _mapperMock;
//    private readonly Mock<IFileService> _fileServiceMock;
//    private readonly DbContextOptions<AlsContext> _dbOptions;

//    public CourseListServiceTests()
//    {
//        _mapperMock = new Mock<IMapper>();
//        _fileServiceMock = new Mock<IFileService>();

//        _dbOptions = new DbContextOptionsBuilder<AlsContext>()
//            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
//            .Options;
//    }

//    private CourseListService CreateServiceWithData(Action<AlsContext> seedData)
//    {
//        var context = new AlsContext(_dbOptions);
//        seedData(context);
//        context.SaveChanges();
//        return new CourseListService(context, _mapperMock.Object, _fileServiceMock.Object);
//    }

//    [Fact]
//    public void GetAllCourses_ReturnsMappedList()
//    {
//        var service = CreateServiceWithData(ctx =>
//        {
//            ctx.Courses.Add(new Course { CourseId = 1, CourseName = "Test Course" });
//        });

//        _mapperMock.Setup(m => m.Map<List<CourseVM>>(It.IsAny<List<Course>>()))
//                   .Returns(new List<CourseVM> { new CourseVM { CourseName = "Test Course" } });

//        var result = service.GetAllCourses();

//        Assert.Single(result);
//        Assert.Equal("Test Course", result.First().CourseName);
//    }

//    [Fact]
//    public async Task CreateCourseAsync_Throws_WhenNameExists()
//    {
//        var service = CreateServiceWithData(ctx =>
//        {
//            ctx.Courses.Add(new Course { CourseId = 1, CourseName = "Duplicate" });
//            ctx.Profiles.Add(new Profile { ProfileId = 1, AccountId = 99, UserId = 10 });
//        });

//        var vm = new CourseCreateVM
//        {
//            CourseName = "Duplicate",
//            Description = "Desc",
//            Price = 100,
//            CategoryId = 1,
//            ClassId = 1
//        };

//        var fileMock = new Mock<IFormFile>();

//        await Assert.ThrowsAsync<Exception>(async () =>
//            await service.CreateCourseAsync(vm, fileMock.Object, 99));
//    }

//    [Fact]
//    public async Task CreateCourseAsync_Success_WhenValidData()
//    {
//        var service = CreateServiceWithData(ctx =>
//        {
//            ctx.Profiles.Add(new Profile { ProfileId = 1, AccountId = 99, UserId = 10 });
//        });

//        var vm = new CourseCreateVM
//        {
//            CourseName = "New Course",
//            Description = "Desc",
//            Price = 100,
//            CategoryId = 1,
//            ClassId = 1
//        };

//        var fileMock = new Mock<IFormFile>();
//        fileMock.Setup(f => f.Length).Returns(10);

//        _fileServiceMock.Setup(f => f.UploadImageAsync(It.IsAny<IFormFile>(), "course"))
//                        .ReturnsAsync("path/image.jpg");

//        var result = await service.CreateCourseAsync(vm, fileMock.Object, 99);

//        Assert.True(result);
//    }

//    [Fact]
//    public async Task UpdateCourseAsync_Throws_WhenCourseNotFound()
//    {
//        var service = CreateServiceWithData(ctx =>
//        {
//            ctx.Profiles.Add(new Profile { ProfileId = 1, AccountId = 99, UserId = 10 });
//        });

//        var vm = new CourseUpdateVM { CourseName = "ABC", Price = 100 };

//        await Assert.ThrowsAsync<Exception>(async () =>
//            await service.UpdateCourseAsync(999, vm, null, 99));
//    }

//    [Fact]
//    public async Task SetCourseStatusAsync_UpdatesModulesAndLessons()
//    {
//        var service = CreateServiceWithData(ctx =>
//        {
//            ctx.Courses.Add(new Course { CourseId = 1, CourseName = "Test", Status = false });
//            ctx.Modules.Add(new Module { Id = 1, CourseId = 1, Status = false });
//            ctx.Lessons.Add(new Lesson { LessonId = 1, ModuleId = 1, Status = false });
//        });

//        var result = await service.SetCourseStatusAsync(1, true);

//        Assert.True(result);

//        using var context = new AlsContext(_dbOptions);
//        Assert.True(context.Courses.First().Status);
//        Assert.True(context.Modules.First().Status);
//        Assert.True(context.Lessons.First().Status);
//    }
//}
