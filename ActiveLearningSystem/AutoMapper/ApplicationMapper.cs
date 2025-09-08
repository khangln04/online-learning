using AutoMapper;
using ActiveLearningSystem.Model;
using AutoMapperProfile = AutoMapper.Profile;
using ActiveLearningSystem.ViewModel;
using ActiveLearningSystem.ViewModel.AdminViewModels;
using ActiveLearningSystem.ViewModel.PublicViewModels;
using ActiveLearningSystem.ViewModel.AuthenViewModels;
using ActiveLearningSystem.ViewModel.PupilviewModels.QuizzViewModels;
using ActiveLearningSystem.ViewModel.PupilviewModels;
using ActiveLearningSystem.ViewModel.MaketerViewModels;
using ActiveLearningSystem.ViewModel.ParentViewModels;
using ActiveLearningSystem.Payment;
using ActiveLearningSystem.ViewModel.PupilViewModels;
using ActiveLearningSystem.ViewModel.InstructorViewModels;
namespace ActiveLearningSystem.AutoMapper

{
    public class ApplicationMapper : AutoMapperProfile
    {
        public ApplicationMapper()
        {
            CreateMap<Course, CourseVM>()
                .ForMember(dest => dest.CategoryName, otp => otp.MapFrom(src => src.Category.Name))
                .ForMember(dest => dest.AuthorName, otp => otp.MapFrom(src => src.Author.Name))
                .ForMember(dest => dest.ClassName, otp => otp.MapFrom(src => src.Class.Name))
                .ForMember(dest => dest.Modules, otp => otp.MapFrom(src => src.Modules))
                .ReverseMap();

            CreateMap<Blog, BannerVM>()
               .ReverseMap();

            CreateMap<Feedback, FeedbackVM>()
                .ForMember(dest => dest.AuthorName, opt => opt.MapFrom(src => src.Author.Name))
                .ForMember(dest => dest.Avatar, opt => opt.MapFrom(src => src.Author.Avatar))
                .ForMember(dest => dest.CourseName, opt => opt.MapFrom(src => src.Course.CourseName));


            CreateMap<Module, ModuleVM>()
                .ForMember(dest => dest.CourseName, otp => otp.MapFrom(src => src.Course.CourseName))
                .ForMember(dest => dest.Lessons, otp => otp.MapFrom(src => src.Lessons))
                .ReverseMap();

            CreateMap<Lesson, ActiveLearningSystem.ViewModel.PublicViewModels.LessonViewVM>()
                .ReverseMap();

            CreateMap<Quizz, QuizzVM>()
           .ForMember(dest => dest.ModuleName, otp => otp.MapFrom(src => src.Module.ModuleName)).ReverseMap();
            CreateMap<Quizz, QuizzManageVM>()
                   .ForMember(dest => dest.ModuleName, otp => otp.MapFrom(src => src.Module.ModuleName))
                   .ForMember(dest => dest.Topics, otp => otp.MapFrom(src => src.QuizzTopics.Select(qt => new TopicByQuizzVM
                   {
                       Id = qt.Topic.Id, // Ánh xạ Id
                       Name = qt.Topic.Name // Ánh xạ Name
                   })))
                   .ReverseMap();

            CreateMap<Topic, TopicByQuizzVM>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id)) // Ánh xạ Id
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name)); // Ánh xạ Name

            CreateMap<Blog, BlogVM>()
.ForMember(dest => dest.AuthorName, otp => otp.MapFrom(src => src.Author.Name))
                .ForMember(dest => dest.TotalComments, opt => opt.MapFrom(src => src.Comments.Count))
                .ReverseMap();

            CreateMap<Account, AccountVM>()
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Profiles.FirstOrDefault()!.Name))
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Profiles.FirstOrDefault()!.Email))
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Profiles.FirstOrDefault()!.Role.Name))
                .ForMember(dest => dest.CreatedDate, opt => opt.MapFrom(src => src.CreatedDate))
                .ForMember(dest => dest.UpdatedDate, opt => opt.MapFrom(src => src.UpdatedDate))
                .ReverseMap();

            CreateMap<Model.Profile, AccountDetailsVM>()
                .ForMember(dest => dest.AccountId, opt => opt.MapFrom(src => src.Account.Id))
                .ForMember(dest => dest.ProfileId, opt => opt.MapFrom(src => src.UserId))
                .ForMember(dest => dest.Sex, opt => opt.MapFrom(src => src.Sex ? "Nam" : "Nữ"))
                .ForMember(dest => dest.RoleName, opt => opt.MapFrom(src => src.Role.Name))
                .ReverseMap();

            //
            CreateMap<CreateAccount, Account>()
                .ForMember(dest => dest.CreatedDate, opt => opt.MapFrom(_ => DateOnly.FromDateTime(DateTime.Now)))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => true))
                .ReverseMap();

            //create account by admin
            CreateMap<CreateAccount, Model.Profile>()
                .ForMember(dest => dest.Sex, opt => opt.MapFrom(src => src.Sex == Gender.Nam))
                .ForMember(dest => dest.Avatar, opt => opt.MapFrom(_ => "/profile/default.jpg"))
                .ReverseMap();
            CreateMap<Quizz, QuizzViewVM>();
            // Manage Module
            CreateMap<ModuleManagerVM, Module>()
                .ForMember(dest => dest.CourseId, opt => opt.MapFrom(src => src.CourseId))
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.ModuleId))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description))
                .ReverseMap();

            CreateMap<Module, ModuleDetailsManagerVM>()
                .ForMember(dest => dest.ModuleId, opt => opt.MapFrom(src => src.Id))
                .ReverseMap();

            CreateMap<CreateModuleVM, Module>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => true))
                .ReverseMap();
            // CourseProgress → CourseCompletionVM
            CreateMap<CourseProgress, CourseCompletionVM>()
                .ForMember(dest => dest.CourseId,
                           opt => opt.MapFrom(src => src.CourseStudent.CourseId))
                .ForMember(dest => dest.ModuleCompletionVMs,
                           opt => opt.MapFrom(src => src.ModuleProgresses))
                .ForMember(dest => dest.CourseProgressId, opt => opt.MapFrom(src => src.Id));
            // ModuleProgress → ModuleCompletionVM
            CreateMap<ModuleProgress, ModuleCompletionVM>()
                .ForMember(dest => dest.Id,
                           opt => opt.MapFrom(src => src.Module.Id))
                .ForMember(dest => dest.ModuleName,
                           opt => opt.MapFrom(src => src.Module.ModuleName))
                .ForMember(dest => dest.Description,
                           opt => opt.MapFrom(src => src.Module.Description))
                .ForMember(dest => dest.ModuleNum,
                           opt => opt.MapFrom(src => src.Module.ModuleNum))
                .ForMember(dest => dest.Lessons,
                           opt => opt.MapFrom(src => src.LessonProgresses))
                // Lấy tất cả quiz thuộc module
                .ForMember(dest => dest.Quizzs,
                           opt => opt.MapFrom(src => src.Module.Quizzs));

            // LessonProgress → LessonCompletionVM
            CreateMap<LessonProgress, LessonCompletionVM>()
                .ForMember(dest => dest.Id,
                           opt => opt.MapFrom(src => src.VideoId))
                .ForMember(dest => dest.VideoNum,
                           opt => opt.MapFrom(src => src.Video.VideoNum))
                .ForMember(dest => dest.Description,
                           opt => opt.MapFrom(src => src.Video.Description));

            // Quizz → QuizzCompletionVM
            CreateMap<Quizz, QuizzCompletionVM>()
                .ForMember(dest => dest.Id,
                    opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.Title,
                    opt => opt.MapFrom(src => src.Title));



            CreateMap<CourseProgress, CourseCompletionVM>()
            .ForMember(dest => dest.CourseId, opt => opt.MapFrom(src => src.CourseStudent.CourseId))
            .ForMember(dest => dest.ModuleCompletionVMs, opt => opt.MapFrom(src => src.ModuleProgresses));

            // ModuleProgress → ModuleCompletionVM
            CreateMap<ModuleProgress, ModuleCompletionVM>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Module.Id))
                .ForMember(dest => dest.ModuleName, opt => opt.MapFrom(src => src.Module.ModuleName))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Module.Description))
                .ForMember(dest => dest.ModuleNum, opt => opt.MapFrom(src => src.Module.ModuleNum))
                .ForMember(dest => dest.Lessons, opt => opt.MapFrom(src => src.LessonProgresses))
                .ForMember(dest => dest.Quizzs, opt => opt.MapFrom(src => src.UserQuizzs));

            // LessonProgress → LessonCompletionVM
            CreateMap<LessonProgress, LessonCompletionVM>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.VideoId))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Video.Description))
                .ForMember(dest => dest.VideoNum, opt => opt.MapFrom(src => src.Video.VideoNum));

            // ánh xạ từ UserQuizz → QuizzCompletionVM
            CreateMap<UserQuizz, QuizzCompletionVM>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Quiz.Id))
                .ForMember(dest => dest.Title, opt => opt.MapFrom(src => src.Quiz.Title));
            // UserQuizz → QuizzCompletionVM
            CreateMap<UserQuizz, QuizzCompletionVM>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.QuizId))
                .ForMember(dest => dest.Title, opt => opt.MapFrom(src => src.Quiz.Title))
                .ForMember(dest => dest.StartAt, opt => opt.MapFrom(src => src.StartAt))
                .ForMember(dest => dest.SubmitAt, opt => opt.MapFrom(src => src.SubmitAt))
                .ForMember(dest => dest.Duration, opt => opt.MapFrom(src => src.Duration))
                .ForMember(dest => dest.Score, opt => opt.MapFrom(src => src.Score))
                .ForMember(dest => dest.IsPass, opt => opt.MapFrom(src => src.IsPass))
                .ForMember(dest => dest.Questions, opt => opt.MapFrom(src => src.UserQuizzQuestions));

            CreateMap<UserQuizz, QuizzProgressVM>()
     .ForMember(dest => dest.UserQuizzId, opt => opt.MapFrom(src => src.Id));
            // UserQuizzQuestion → QuizzQuestionCompletionVM
            CreateMap<UserQuizzQuestion, QuizzQuestionCompletionVM>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Queestionid))
                .ForMember(dest => dest.QuestionContent, opt => opt.MapFrom(src => src.Queestion.Content))
                .ForMember(dest => dest.Answers, opt => opt.MapFrom(src => src.Queestion.Answers));

            // Answer → QuizzAnswerCompletionVM
            CreateMap<Answer, QuizzAnswerCompletionVM>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.AnswerContent, opt => opt.MapFrom(src => src.Content))
                .ForMember(dest => dest.IsCorrect, opt => opt.MapFrom(src => src.IsCorrect));


            //leson
            CreateMap<Lesson, ActiveLearningSystem.ViewModel.PupilViewModels.LessonVM>()
                .ForMember(dest => dest.CreatedDate, opt => opt.MapFrom(src => src.CreatedDate.ToDateTime(TimeOnly.MinValue)));
            CreateMap<Lesson, LessonCreateVM>();
            CreateMap<Lesson, LessonUpdateVM>();
                CreateMap<Question, QuestionListVM>()
                .ForMember(dest => dest.TopicName, opt => opt.MapFrom(src => src.Topic.Name));
            CreateMap<Answer, AnswerListVM>();
            CreateMap<AnswerCreateVM, Answer>().ReverseMap();
            CreateMap<QuestionCreateVM, Question>();

            CreateMap<UserQuizz, QuizzCompletionVM>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.QuizId));


            //Quizz Area 
            // Ánh xạ giữa Quizz và QuizzVM
            CreateMap<Quizz, QuizzVM>();

            CreateMap<QuizzCreateVM, Quizz>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreateAt, opt => opt.Ignore());

            CreateMap<UpdateQuizzVM, Quizz>()
                .ForMember(dest => dest.Id, opt => opt.Ignore());

            CreateMap<Topic, TopicVM>();


            CreateMap<Question, QuestionsVM>()
                .ForMember(dest => dest.Answers, opt => opt.MapFrom(src => src.Answers));

            // Ánh xạ giữa Answer và AnswerVM
            CreateMap<Answer, AnswerVM>();

            // Ánh xạ giữa UserQuiz và UserQuizVM
            CreateMap<UserQuizz, UserQuizzVM>()
                .ForMember(dest => dest.Questions, opt => opt.Ignore()); // Bỏ qua để sau này cập nhật

            // Ánh xạ giữa UserQuizQuestion và UserQuizQuestionVM
            CreateMap<UserQuizzQuestion, UserQuizzQuestionVM>();
            CreateMap<UserAnswer, UserAnswerVM>();

            CreateMap<Topic, TopicVM>()
                .ForMember(dest => dest.ClassName, opt => opt.MapFrom(src => src.Class.Name))
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category.Name))
                .ReverseMap();



            //
            CreateMap<Blog, BlogSummaryVM>()
                .ForMember(dest => dest.AuthorName, opt => opt.MapFrom(src => src.Author.Name))
                .ForMember(dest => dest.BlogId, opt => opt.MapFrom(src => src.Id));

            CreateMap<Class, ClassVM>().ReverseMap();

            CreateMap<StudentCourse, CourseOverviewVM>()
                .ForMember(dest => dest.StudentCourseId, opt => opt.MapFrom(src => src.StudentCourseId))
                .ForMember(dest => dest.CourseId, opt => opt.MapFrom(src => src.CourseId))
                .ForMember(dest => dest.CourseName, opt => opt.MapFrom(src => src.Course.CourseName))
                .ForMember(dest => dest.Image, opt => opt.MapFrom(src => src.Course.Image))
                .ForMember(dest => dest.StatusName, opt => opt.MapFrom(src =>
                            src.StatusNavigation.StatusName))
                .ForMember(dest => dest.StartDate, opt => opt.MapFrom(src =>
                            src.CourseProgresses.FirstOrDefault().StartDate))
                .ForMember(dest => dest.LastAccess, opt => opt.MapFrom(src =>
                            src.CourseProgresses.FirstOrDefault().LastAccess));

            CreateMap<Category, CategoryVM>().ReverseMap();

            // LessonProgress mapping
            CreateMap<LessonProgress, LessonProgressVM>()
                .ForMember(dest => dest.LessonId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.LessonName, opt => opt.MapFrom(src => src.Video.Description))
                .ForMember(dest => dest.IsCompleted, opt => opt.MapFrom(src => src.Status));

            // ModuleProgress mapping
            CreateMap<ModuleProgress, ModuleProgressVM>()
                .ForMember(dest => dest.ModuleId, opt => opt.MapFrom(src => src.ModuleId))
                .ForMember(dest => dest.ModuleName, opt => opt.MapFrom(src => src.Module.ModuleName))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status)) // bool
                .ForMember(dest => dest.Lessons, opt => opt.MapFrom(src => src.LessonProgresses));

            // CourseProgress mapping
            CreateMap<CourseProgress, CourseProgressDetailVM>()
                //.ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.StatusNavigation.StatusName))
                .ForMember(dest => dest.Modules, opt => opt.MapFrom(src => src.ModuleProgresses));

            // CoursePayment
            CreateMap<CoursePayment, PaidCourseHistoryVM>()
                .ForMember(dest => dest.CourseName, opt => opt.MapFrom(src => src.StudentCourse.Course.CourseName))
                .ForMember(dest => dest.coursepaymentId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.Amount, opt => opt.MapFrom(src => src.Amount))
                .ForMember(dest => dest.PaidAt, opt => opt.MapFrom(src => src.PaidAt))
                .ForMember(dest => dest.IsPaid, opt => opt.MapFrom(src => src.IsPaid));

            //----------------------------------------------------
            // Khang
            //login
            CreateMap<Account, LoginResponseVM>()
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Profiles.FirstOrDefault()!.Name))
                .ForMember(dest => dest.Avatar, opt => opt.MapFrom(src => src.Profiles.FirstOrDefault()!.Avatar))
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Profiles.FirstOrDefault()!.Email))
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Profiles.FirstOrDefault()!.Role.Name));

            //register by user (not by admin)
            CreateMap<CreateAccountVM, Account>()
                .ForMember(dest => dest.CreatedDate, opt => opt.MapFrom(_ => DateOnly.FromDateTime(DateTime.Now)))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => true))
                .ReverseMap();

            //register by user (not by admin)
            CreateMap<CreateAccountVM, Model.Profile>()
                .ForMember(dest => dest.Sex, opt => opt.MapFrom(src => src.Sex == Gender.Nam))
                .ForMember(dest => dest.Avatar, opt => opt.MapFrom(_ => "/profile/default.jpg"))
                .ForMember(dest => dest.CreatedDate, opt => opt.MapFrom(_ => DateOnly.FromDateTime(DateTime.Now)))
                .ReverseMap();

            //my profile fuction
            CreateMap<Model.Profile, MyProfileVM>()
                .ForMember(dest => dest.Sex, opt => opt.MapFrom(src => src.Sex ? "Nam" : "Nữ"))
                .ForMember(dest => dest.RoleName, opt => opt.MapFrom(src => src.Role.Name))
                .ReverseMap();

            //report create function
            CreateMap<CreateReportVM, Report>()
                .ForMember(dest => dest.CreatedDate, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.StatusId, opt => opt.MapFrom(_ => 1)) // Default to "summit"
                .ForMember(dest => dest.IsDeleted, opt => opt.MapFrom(_ => false))
                .ForMember(dest => dest.ReceiverId, opt => opt.Ignore()) // Sẽ ánh xạ trong service
                .ForMember(dest => dest.UserId, opt => opt.Ignore()); // Sẽ ánh xạ trong service

            // Ánh xạ cho Report sang ReportDetailVM (giữ nguyên nhưng đảm bảo Comments được ánh xạ đúng)
            CreateMap<Report, ReportDetailVM>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.Name))
                .ForMember(dest => dest.ReceiverName, opt => opt.MapFrom(src => src.Receiver.Name))
                .ForMember(dest => dest.StatusName, opt => opt.MapFrom(src => src.Status.Name))
                .ForMember(dest => dest.FileNames, opt => opt.MapFrom(src => src.ReportFiles.Select(rf => rf.FilePath).ToList()))
                .ForMember(dest => dest.ListStatus, opt => opt.Ignore())
                .ForMember(dest => dest.Comments, opt => opt.MapFrom(src => src.ReportComments))
                .ForMember(dest => dest.LastStatusUpdated, opt => opt.MapFrom(src => src.LastStatusUpdated ?? DateTime.MinValue));

            CreateMap<ReportComment, CommentReportVM>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.Name))
                .ForMember(dest => dest.RoleName, opt => opt.MapFrom(src => src.User.Role.Name)); // Thêm dòng này để ánh xạ RoleName

            //--------------------------------------------------------------------------------------------

            // Payment               
            CreateMap<VnPayPayment, VnPayPaymentVM>();

            CreateMap<CoursePayment, CoursePaymentVM>()
                .ForMember(dest => dest.CourseName, opt => opt.MapFrom(src => src.StudentCourse.Course.CourseName))
                .ForMember(dest => dest.StudentName, opt => opt.MapFrom(src => src.StudentCourse.Pupil.Name))
                .ForMember(dest => dest.VnPayPayments, opt => opt.MapFrom(src => src.VnPayPayments));

            //Topic
            CreateMap<Topic, TopicListVM>()
                .ForMember(dest => dest.ClassName, opt => opt.MapFrom(src => src.Class != null ? src.Class.Name : null))
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : null));

            CreateMap<TopicCreateUpdateVM, Topic>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore());

            //CommentBlog
            CreateMap<Comment, CommentVM>()
                .ForMember(dest => dest.AuthorName, opt => opt.MapFrom(src => src.Author.Name))
                .ForMember(dest => dest.AuthorAvatar, opt => opt.MapFrom(src => src.Author.Avatar));

            //Progress
            CreateMap<CourseProgressCreateVM, CourseProgress>();
            CreateMap<ModuleProgressCreateVM, ModuleProgress>();
            CreateMap<LessonProgressCreateVM, LessonProgress>();
        }
    }
}