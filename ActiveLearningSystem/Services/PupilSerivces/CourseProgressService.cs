using ActiveLearningSystem.Model;
using ActiveLearningSystem.Services.MailService;
using ActiveLearningSystem.Services.PublicServices;
using ActiveLearningSystem.ViewModel.PublicViewModels;
using ActiveLearningSystem.ViewModel.PupilviewModels;
using ActiveLearningSystem.ViewModel.PupilViewModels;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;

namespace ActiveLearningSystem.Services.PupilSerivces
{
    public class CourseProgressService : ICourseProgressService
    {
        private readonly AlsContext _context;
        private readonly IMapper _mapper;
        private readonly IVideoService _videoService;
        private readonly IMailService _mailService;

        public CourseProgressService(AlsContext context, IMapper mapper, IVideoService videoService, IMailService mailService)
        {
            _context = context;
            _mapper = mapper;
            _videoService = videoService;
            _mailService = mailService;
        }

        public async Task<List<CourseOverviewVM>> GetCoursesByStudentAsync(int accountId)
        {

            var user = await _context.Profiles.FirstOrDefaultAsync(p => p.AccountId == accountId);
            int userId = user.UserId;

            var studentCourses = await _context.StudentCourses
                .Where(sc => sc.PupilId == userId && (sc.Status == 2 || sc.Status == 4))
                .Include(sc => sc.Course)
                .Include(sc => sc.CourseProgresses)
                .Include(sc => sc.StatusNavigation)
                .OrderBy(sc => sc.Status == 4 ? 0 : 1)
                .ThenByDescending(sc => sc.StudentCourseId)
                .ToListAsync();

            if (studentCourses == null || !studentCourses.Any())
            {
                Console.WriteLine($"Không tìm thấy khóa học cho PupilId: {userId}");
                return new List<CourseOverviewVM>();
            }

            return _mapper.Map<List<CourseOverviewVM>>(studentCourses);
        }

        public async Task<List<CourseOverviewVM>> GetCompletedCoursesByStudentAsync(int accountId)
        {
            var user = await _context.Profiles.FirstOrDefaultAsync(p => p.AccountId == accountId);
            int userId = user.UserId;

            // Lấy danh sách khóa học đã hoàn thành (Status = 3)
            var completedCourses = await _context.StudentCourses
                .Where(sc => sc.PupilId == userId && sc.Status == 3)
                .Include(sc => sc.Course)
                .Include(sc => sc.CourseProgresses)
                .Include(sc => sc.StatusNavigation)
                .OrderByDescending(sc => sc.StudentCourseId) // Sắp xếp Id giảm dần
                .ToListAsync();

            if (completedCourses == null || !completedCourses.Any())
            {
                Console.WriteLine($"Không tìm thấy khóa học đã hoàn thành cho PupilId: {userId}");
                return new List<CourseOverviewVM>();
            }

            // Ánh xạ sang CourseOverviewVM
            return _mapper.Map<List<CourseOverviewVM>>(completedCourses);
        }
        public async Task<bool> CheckInfo(int courseStudentId, int accountId)
        {
            var user = await _context.Profiles
                .FirstOrDefaultAsync(p => p.AccountId == accountId);

            if (user == null)
                return false; // Không tìm thấy user

            var course = await _context.StudentCourses
                .FirstOrDefaultAsync(x => x.StudentCourseId == courseStudentId);

            if (course == null)
                return false; // Không tìm thấy course

            var pupilInfo = await _context.Profiles
                .FirstOrDefaultAsync(x => x.UserId == course.PupilId);

            int parentId = pupilInfo?.ParentId ?? 0;

            // So sánh
            return (course.PupilId == user.UserId || parentId == user.UserId);
        }

        public async Task<CourseProgressDetailVM?> GetCourseProgressDetailAsync(int courseStudentId)
        {
            

            // Lấy thông tin StudentCourse + Course gốc
            var studentCourse = await _context.StudentCourses
                .Include(sc => sc.Course)
                    .ThenInclude(c => c.Modules)
                        .ThenInclude(m => m.Lessons)
                .Include(sc => sc.Course)
                    .ThenInclude(c => c.Modules)
                        .ThenInclude(m => m.Quizzs)
                .FirstOrDefaultAsync(sc => sc.StudentCourseId == courseStudentId);

            if (studentCourse == null)
                return null;

            // Lấy progress
            var courseProgress = await _context.CourseProgresses
                .Include(cp => cp.ModuleProgresses)
                    .ThenInclude(mp => mp.LessonProgresses)
                .Include(cp => cp.ModuleProgresses)
                    .ThenInclude(mp => mp.UserQuizzs)
                .FirstOrDefaultAsync(cp => cp.CourseStudentId == courseStudentId);

            // Nếu chưa có progress => trả về mặc định
            if (courseProgress == null)
            {
                return new CourseProgressDetailVM
                {
                    Id = 0,
                    StartDate = null,
                    LastAccess = null,
                    Status = "Not Started",
                    Modules = studentCourse.Course.Modules.Select(m => new ModuleProgressVM
                    {
                        ModuleId = m.Id,
                        ModuleName = m.ModuleName,
                        Status = false,
                        StartDate = null,
                        LastAccess = null,
                        Lessons = m.Lessons.Select(l => new LessonProgressVM
                        {
                            LessonId = l.Id,
                            LessonName = l.Title,
                            LastWatched = null,
                            IsCompleted = false
                        }).ToList(),
                        Quizzs = m.Quizzs.Select(q => new QuizzProgressVM
                        {
                            Id = q.Id,
                            UserQuizzId = 0,
                            Title = q.Title,
                            Description = q.Description,
                            QuestionCount = q.QuestionCount,
                            TimeLimit = q.TimeLimit,
                            RequiredScore = q.RequiredScore
                        }).ToList()
                    }).ToList()
                };
            }

            // Nếu đã có progress => map dữ liệu thực
            var course = studentCourse.Course;
            var result = new CourseProgressDetailVM
            {
                Id = courseProgress.Id,
                StartDate = courseProgress.StartDate,
                LastAccess = courseProgress.LastAccess,
                Status = courseProgress.Status ? "True" : "False",

                Modules = course.Modules.Select(module =>
                {
                    var mp = courseProgress.ModuleProgresses
                        .FirstOrDefault(x => x.ModuleId == module.Id);

                    return new ModuleProgressVM
                    {
                        ModuleId = module.Id,
                        ModuleName = module.ModuleName,
                        Status = mp?.Status ?? false,
                        StartDate = mp?.StartDate,
                        LastAccess = mp?.LastAccess,
                        Lessons = module.Lessons.Select(lesson =>
                        {
                            var lp = mp?.LessonProgresses
                                .FirstOrDefault(x => x.VideoId == lesson.Id);

                            return new LessonProgressVM
                            {
                                LessonId = lesson.Id,
                                LessonName = lesson.Title,
                                LastWatched = lp?.LastWatched,
                                IsCompleted = lp?.Status ?? false
                            };
                        }).ToList(),
                        Quizzs = module.Quizzs
                      .SelectMany(q =>
                          (mp?.UserQuizzs?
                              .Where(u => u.QuizId == q.Id)
                              .OrderByDescending(u => u.StartAt)
                              .Select(uq => new QuizzProgressVM
                              {
                                  Id = q.Id,
                                  UserQuizzId = uq.Id,
                                  Title = q.Title,
                                  Description = q.Description,
                                  QuestionCount = q.QuestionCount,
                                  TimeLimit = q.TimeLimit,
                                  RequiredScore = q.RequiredScore,
                                  StartAt = uq.StartAt,
                                  SubmitAt = uq.SubmitAt,
                                  Duration = uq.Duration,
                                  Score = uq.Score,
                                  IsPass = uq.IsPass
                              }) ?? new List<QuizzProgressVM>())
                      )
                      .ToList()
                                      };
                }).ToList()
            };

            return result;
        }


        public async Task<List<CourseOverviewVM>> GetCoursesByStudent(int accountId)
        {

            var user = await _context.Profiles.FirstOrDefaultAsync(p => p.AccountId == accountId);
            int userId = user.UserId;

            var studentCourses = await _context.StudentCourses
                .Where(sc => sc.PupilId == userId && (sc.Status == 2 || sc.Status == 4))
                .Include(sc => sc.Course)
                .Include(sc => sc.CourseProgresses)
                .Include(sc => sc.StatusNavigation)
                .OrderBy(sc => sc.Status == 2 ? 0 : 1)
                .ThenByDescending(sc => sc.StudentCourseId)
                .ToListAsync();

            if (studentCourses == null || !studentCourses.Any())
            {
                Console.WriteLine($"Không tìm thấy khóa học cho PupilId: {userId}");
                return new List<CourseOverviewVM>();
            }

            return _mapper.Map<List<CourseOverviewVM>>(studentCourses);
        }

        public async Task<bool> InsertOrUpdateCourseProgressAsync(CourseProgressCreateVM model)
        {
            var courseProgress = await _context.CourseProgresses
                .FirstOrDefaultAsync(cp => cp.CourseStudentId == model.CourseStudentId);
            var studentCourse = await _context.StudentCourses
                    .FirstOrDefaultAsync(sc => sc.StudentCourseId == model.CourseStudentId);

            if (studentCourse != null && studentCourse.Status == 4)
            {
                studentCourse.Status = 2;
                _context.StudentCourses.Update(studentCourse);
            }

            if (courseProgress == null)
            {
                courseProgress = _mapper.Map<CourseProgress>(model);
                courseProgress.StartDate = DateOnly.FromDateTime(DateTime.Now);
                courseProgress.LastAccess = DateOnly.FromDateTime(DateTime.Now);
                courseProgress.Status = false;

                await _context.CourseProgresses.AddAsync(courseProgress);
            }
            else
            {
                if (!courseProgress.Status)
                {
                    courseProgress.LastAccess = DateOnly.FromDateTime(DateTime.Now);
                    _context.CourseProgresses.Update(courseProgress);
                }
            }

            var result = await _context.SaveChangesAsync();
            return result > 0;
        }

        public async Task<bool> InsertOrUpdateModuleProgressAsync(ModuleProgressCreateVM model)
        {
            var moduleProgress = await _context.ModuleProgresses
                .FirstOrDefaultAsync(mp => mp.CourseProcessId == model.CourseProcessId && mp.ModuleId == model.ModuleId);

            if (moduleProgress == null)
            {
                moduleProgress = _mapper.Map<ModuleProgress>(model);
                moduleProgress.StartDate = DateOnly.FromDateTime(DateTime.Now);
                moduleProgress.LastAccess = DateOnly.FromDateTime(DateTime.Now);
                moduleProgress.Status = false;

                await _context.ModuleProgresses.AddAsync(moduleProgress);
            }
            else
            {
                if (!moduleProgress.Status)
                {
                    moduleProgress.LastAccess = DateOnly.FromDateTime(DateTime.Now);
                    _context.ModuleProgresses.Update(moduleProgress);
                }
            }

            var result = await _context.SaveChangesAsync();
            return result > 0;
        }

        public async Task<bool> InsertOrUpdateLessonProgressAsync(LessonProgressCreateVM model)
        {
            var lessonProgress = await _context.LessonProgresses
                .FirstOrDefaultAsync(lp => lp.ModuleProgressId == model.ModuleProgressId && lp.VideoId == model.VideoId);

            if (lessonProgress == null)
            {
                lessonProgress = _mapper.Map<LessonProgress>(model);
                lessonProgress.Status = false;
                lessonProgress.LastWatched = DateOnly.FromDateTime(DateTime.Now);
                await _context.LessonProgresses.AddAsync(lessonProgress);
            }
            else
            {
                if (!lessonProgress.Status)
                {
                    lessonProgress.LastWatched = DateOnly.FromDateTime(DateTime.Now);
                    _context.LessonProgresses.Update(lessonProgress);
                }
            }

            var result = await _context.SaveChangesAsync();

            var moduleProgress = await _context.ModuleProgresses
                .Include(mp => mp.CourseProcess)
                .FirstOrDefaultAsync(mp => mp.Id == model.ModuleProgressId);

            if (moduleProgress != null)
            {
                await CheckLearningProgressAsync(moduleProgress.CourseProcess.CourseStudentId);
            }

            return result > 0;
        }


        public async Task<CourseCompletionVM?> GetCourseCompletionAsync(int studentCourseId)
        {
            var studentCourse = await _context.StudentCourses
                .Include(sc => sc.Course)
                    .ThenInclude(c => c.Modules)
                .ThenInclude(m => m.Lessons)
                .Include(sc => sc.Course)
                    .ThenInclude(c => c.Modules)
                .ThenInclude(m => m.Quizzs)
                .FirstOrDefaultAsync(sc => sc.StudentCourseId == studentCourseId);

            if (studentCourse == null)
                return null;

            var courseProgress = await _context.CourseProgresses
                .Include(cp => cp.ModuleProgresses)
                    .ThenInclude(mp => mp.LessonProgresses)
                .Include(cp => cp.ModuleProgresses)
                    .ThenInclude(mp => mp.UserQuizzs)
                        .ThenInclude(uq => uq.UserQuizzQuestions)
                            .ThenInclude(uqq => uqq.Queestion)
                                .ThenInclude(q => q.Answers)
                .Include(cp => cp.ModuleProgresses)
                    .ThenInclude(mp => mp.UserQuizzs)
                        .ThenInclude(uq => uq.UserAnswers)
                .FirstOrDefaultAsync(cp => cp.CourseStudentId == studentCourseId);

            if (courseProgress == null)
            {
                return new CourseCompletionVM
                {
                    CourseId = studentCourse.CourseId,
                    CourseName = studentCourse.Course.CourseName,
                    Description = studentCourse.Course.Description,
                    Image = studentCourse.Course.Image,
                    CourseProgressId = 0,
                    TotalModules = studentCourse.Course.Modules.Count,
                    ModuleCompletionVMs = studentCourse.Course.Modules.Select(m => new ModuleCompletionVM
                    {
                        ModuleProgressID = 0,
                        Id = m.Id,
                        ModuleName = m.ModuleName,
                        Description = m.Description,
                        ModuleNum = m.ModuleNum,
                        TotalLessons = m.Lessons?.Count ?? 0,
                        Lessons = m.Lessons?.Select(v => new LessonCompletionVM
                        {
                            Id = v.Id,
                            Title = v.Title,
                            Description = v.Description,
                            VideoNum = v.VideoNum,
                            Link = v.Link
                        }).ToList() ?? new List<LessonCompletionVM>(),

                        Quizzs = m.Quizzs?.Select(q => new QuizzCompletionVM
                        {
                            Id = q.Id,
                            Title = q.Title,
                            Description = q.Description,
                            QuestionCount = q.QuestionCount,
                            TimeLimit = q.TimeLimit,
                            RequiredScore = q.RequiredScore,
                            Score = null,
                            IsPass = null,
                            Questions = new List<QuizzQuestionCompletionVM>()
                        }).ToList() ?? new List<QuizzCompletionVM>()
                    }).ToList()
                };
            }


            // Ghép dữ liệu y nguyên logic cũ
            var course = studentCourse.Course;

            var result = new CourseCompletionVM
            {
                CourseId = course.CourseId,
                CourseName = course.CourseName,
                Description = course.Description,
                Image = course.Image,
                CourseProgressId = courseProgress.Id,
                TotalModules = course.Modules.Count,
                StartDate = courseProgress.StartDate,
                LastAccess = courseProgress.LastAccess,
                Status = courseProgress.Status,
                ModuleCompletionVMs = course.Modules.Select(module =>
                {
                    var mp = courseProgress.ModuleProgresses.FirstOrDefault(x => x.ModuleId == module.Id);

                    return new ModuleCompletionVM
                    {
                        ModuleProgressID = mp?.Id ?? 0,
                        Id = module.Id,
                        ModuleName = module.ModuleName,
                        Description = module.Description,
                        ModuleNum = module.ModuleNum,
                        TotalLessons = module.Lessons.Count,
                        StartDate = mp?.StartDate,
                        LastAccess = mp?.LastAccess,
                        Status = mp?.Status ?? false,

                        Lessons = module.Lessons.Select(video =>
                        {
                            var lp = mp?.LessonProgresses.FirstOrDefault(x => x.VideoId == video.Id);

                            string? securedLink = null;
                            if (!string.IsNullOrEmpty(video.Link))
                            {
                                try
                                {
                                    var uri = new Uri(video.Link);
                                    var fileName = Path.GetFileName(uri.LocalPath);
                                    var folder = course.CourseId.ToString(); // Sửa ở đây
                                    securedLink = _videoService.GenerateSignedUrl( fileName, 120);
                                }
                                catch
                                {
                                }
                            }

                            return new LessonCompletionVM
                            {
                                Id = video.Id,
                                Title = video.Title,
                                Status = lp?.Status ?? false,
                                LastWatch = lp?.LastWatched,
                                Description = video.Description,
                                VideoNum = video.VideoNum,
                                Link = video.Link,
                                SecuredVideoLink = securedLink,
                                LessonProgressId = lp?.Id
                            };
                        }).ToList(),

                        Quizzs = module.Quizzs.Select(q =>
                        {
                            var userQuizzList = mp?.UserQuizzs
                                .Where(uq => uq.QuizId == q.Id)
                                .OrderByDescending(uq => uq.StartAt)
                                .ToList();

                            if (userQuizzList != null && userQuizzList.Any())
                            {
                                var uq = userQuizzList.First(); // lấy bản mới nhất
                                return new QuizzCompletionVM
                                {
                                    Id = q.Id,
                                    UserQuizzId = uq.Id,
                                    Title = q.Title,
                                    Description = q.Description,
                                    QuestionCount = q.QuestionCount,
                                    TimeLimit = q.TimeLimit,
                                    RequiredScore = q.RequiredScore,
                                    StartAt = uq.StartAt,
                                    SubmitAt = uq.SubmitAt,
                                    Duration = uq.Duration,
                                    Score = uq.Score,
                                    IsPass = uq.IsPass,
                                    Questions = uq.UserQuizzQuestions.Select(uqq => new QuizzQuestionCompletionVM
                                    {
                                        Id = uqq.Queestion.Id,
                                        QuestionContent = uqq.Queestion.Content,
                                        Answers = uqq.Queestion.Answers.Select(a => new QuizzAnswerCompletionVM
                                        {
                                            Id = a.Id,
                                            AnswerContent = a.Content,
                                            IsCorrect = a.IsCorrect,
                                            IsSelected = uq.UserAnswers.Any(ua =>
                                                ua.QuestionId == uqq.Queestion.Id &&
                                                ua.AnswerId == a.Id)
                                        }).ToList()
                                    }).ToList()
                                };
                            }
                            else
                            {
                                return new QuizzCompletionVM
                                {
                                    Id = q.Id,
                                    UserQuizzId = 0,
                                    Title = q.Title,
                                    Description = q.Description,
                                    QuestionCount = q.QuestionCount,
                                    TimeLimit = q.TimeLimit,
                                    RequiredScore = q.RequiredScore,
                                    Questions = new List<QuizzQuestionCompletionVM>()
                                };
                            }
                        }).ToList(),
                    };
                }).ToList()
            };

            return result;
        }


        public async Task<bool> CheckLearningProgressAsync(int studentCourseId)
        {
            var courseProgress = await _context.CourseProgresses
                .Include(cp => cp.CourseStudent)
                    .ThenInclude(cs => cs.Course)
                        .ThenInclude(c => c.Modules)
                .Include(cp => cp.ModuleProgresses)
                    .ThenInclude(mp => mp.LessonProgresses)
                .Include(cp => cp.ModuleProgresses)
                    .ThenInclude(mp => mp.UserQuizzs)
                .FirstOrDefaultAsync(cp => cp.CourseStudentId == studentCourseId);

            if (courseProgress == null)
                return false;

            var allModules = courseProgress.CourseStudent.Course.Modules;
            bool allModulesCompleted = true;

            foreach (var module in allModules)
            {
                var moduleProgress = courseProgress.ModuleProgresses
                    .FirstOrDefault(mp => mp.ModuleId == module.Id);

                bool moduleIsCompleted = false;

                if (moduleProgress != null)
                {
                    moduleIsCompleted = moduleProgress.Status;

                    if (!moduleProgress.Status)
                    {
                        bool allLessonsCompleted = moduleProgress.LessonProgresses.All(lp => lp.Status);
                        bool hasPassedQuiz = moduleProgress.UserQuizzs.Any(uq => uq.IsPass == true);

                        if (allLessonsCompleted && hasPassedQuiz)
                        {
                            moduleProgress.Status = true;
                            _context.ModuleProgresses.Update(moduleProgress);
                            moduleIsCompleted = true;
                        }
                    }
                }
                else
                {
                    moduleIsCompleted = false;
                }

                if (!moduleIsCompleted)
                {
                    allModulesCompleted = false;
                }
            }

            if (allModulesCompleted)
            {
                courseProgress.Status = true;
                _context.CourseProgresses.Update(courseProgress);

                var studentCourse = await _context.StudentCourses
                    .FirstOrDefaultAsync(sc => sc.StudentCourseId == studentCourseId);

                if (studentCourse != null)
                {
                    studentCourse.Status = 3;
                    _context.StudentCourses.Update(studentCourse);

                    var pupilProfile = await _context.Profiles
                .FirstOrDefaultAsync(p => p.UserId == studentCourse.PupilId);

                    var parentProfile = pupilProfile?.ParentId != null
                        ? await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == pupilProfile.ParentId)
                        : null;

                    var course = courseProgress.CourseStudent.Course;
                    string courseLink = $"https://localhost:3000/course/{course.CourseId}";

                    if (!string.IsNullOrEmpty(pupilProfile?.Email))
                    {
                        string subjectPupil = $"🎉 Chúc mừng bạn đã hoàn thành khóa học: {course.CourseName}";
                        string bodyPupil = $@"
                        <div style='font-family: Roboto, Arial, sans-serif; max-width:600px; margin:0 auto; border:1px solid #ddd; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1)'>
                            <div style='background:#4caf50; color:white; text-align:center; padding:25px 20px'>
                                <h2 style='margin:0;font-weight:500'>🎉 Hoàn thành khóa học</h2>
                            </div>
                            <div style='padding:20px; font-size:16px; color:#333; line-height:1.6'>
                                <p>Xin chào <b style='color:#2e7d32'>{pupilProfile.Name}</b>,</p>
                                <p>Bạn đã xuất sắc hoàn thành khóa học:</p>
                                <p style='font-size:18px; font-weight:600; color:#1e88e5'>{course.CourseName}</p>
                                <p>Chúc mừng bạn và hy vọng bạn sẽ tiếp tục học tập thật tốt!</p>
                                <p>Cảm ơn bạn đã học tập cùng chúng tôi. Rất mong bạn để lại <span style='color:#ff9800; font-weight:600'>phản hồi/đánh giá</span> để chúng tôi cải thiện dịch vụ.</p>
                                <p style='margin-top:15px'>
                                    👉 <a href='{courseLink}' style='color:#1976d2; font-weight:600; text-decoration:none'>Xem chi tiết khóa học</a>
                                </p>
                            </div>
                            <div style='background:#f9f9f9; text-align:center; padding:15px; color:#777; font-size:13px'>
                                Đây là email tự động. Vui lòng không trả lời.
                            </div>
                        </div>";

                        await _mailService.SendEmailAsync(pupilProfile.Email, subjectPupil, bodyPupil);
                    }

                    if (!string.IsNullOrEmpty(parentProfile?.Email))
                    {
                        string subjectParent = $"📢 Thông báo: Học sinh {pupilProfile?.Name} đã hoàn thành khóa học {course.CourseName}";
                        string bodyParent = $@"
                    <div style='font-family: Roboto, Arial, sans-serif; max-width:600px; margin:0 auto; border:1px solid #ddd; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1)'>
                        <div style='background:#2196f3; color:white; text-align:center; padding:25px 20px'>
                            <h2 style='margin:0;font-weight:500'>📢 Thông báo phụ huynh</h2>
                        </div>
                        <div style='padding:20px; font-size:16px; color:#333; line-height:1.6'>
                            <p>Kính gửi phụ huynh <b style='color:#1565c0'>{parentProfile.Name}</b>,</p>
                            <p>Học sinh <b style='color:#2e7d32'>{pupilProfile.Name}</b> đã hoàn thành khóa học:</p>
                            <p style='font-size:18px; font-weight:600; color:#1e88e5'>{course.CourseName}</p>
                            <p>Rất mong quý phụ huynh dành chút thời gian để gửi <span style='color:#ff9800; font-weight:600'>phản hồi</span> giúp chúng tôi cải thiện chất lượng khóa học.</p>
                            <p style='margin-top:15px'>
                                👉 <a href='{courseLink}' style='color:#1976d2; font-weight:600; text-decoration:none'>Xem chi tiết & Gửi phản hồi</a>
                            </p>
                        </div>
                        <div style='background:#f9f9f9; text-align:center; padding:15px; color:#777; font-size:13px'>
                            Đây là email tự động. Vui lòng không trả lời.
                        </div>
                    </div>";

                        await _mailService.SendEmailAsync(parentProfile.Email, subjectParent, bodyParent);
                    }
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateLessonWatchStatusAsync(LessonWatchUpdateVM vm)
        {
            var progress = await _context.LessonProgresses
                .Include(lp => lp.Video)
                .FirstOrDefaultAsync(lp => lp.Id == vm.LessonProgressId);

            if (progress == null || progress.Video == null || !progress.Video.DurationSeconds.HasValue)
                return false;

            double totalLength = progress.Video.DurationSeconds.Value;
            if (totalLength <= 0) return false;

            double watchedSeconds = Math.Min(vm.WatchedSeconds, totalLength);
            progress.WatchedDuration = watchedSeconds;

            double ratio = watchedSeconds / totalLength;

            if (!progress.Status && ratio >= 0.9)
            {
                progress.Status = true;
                progress.LastWatched = DateOnly.FromDateTime(DateTime.Now);
            }

            await _context.SaveChangesAsync();
            return true;
        }


    }
}