using ActiveLearningSystem.AutoMapper;
using ActiveLearningSystem.Hubs;
using ActiveLearningSystem.Hubs;
using ActiveLearningSystem.Model;
using ActiveLearningSystem.Payment;
using ActiveLearningSystem.Services;
using ActiveLearningSystem.Services.AdminServices;
using ActiveLearningSystem.Services.AuthenServices;
using ActiveLearningSystem.Services.BotChatServices;
using ActiveLearningSystem.Services.InstructorServices;
using ActiveLearningSystem.Services.MailService;
using ActiveLearningSystem.Services.MarketerServices;
using ActiveLearningSystem.Services.ParentServices;
using ActiveLearningSystem.Services.PublicServices;
using ActiveLearningSystem.Services.PupilSerivces;
using ActiveLearningSystem.Services.PupilServices;
using ActiveLearningSystem.Services.StatServices;
using Amazon.S3;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OpenAI;
using System.Text;

namespace ActiveLearningSystem
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllers();
            builder.Services.AddSignalR(); // config SingalR
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddAutoMapper(typeof(ApplicationMapper));
            builder.Services.AddSwaggerGen();

            builder.Services.AddDbContext<AlsContext>(options =>
            options.UseSqlServer(builder.Configuration.GetConnectionString("DB")));
            builder.Services.AddDistributedMemoryCache();
            builder.Services.AddMemoryCache(); // xử lí số lượng promt mà người dùng gửi lên
            builder.Services.AddSession(options =>
            {
                options.IdleTimeout = TimeSpan.FromMinutes(30);
                options.Cookie.HttpOnly = true;
                options.Cookie.IsEssential = true;
            });

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("CORSPolicy", builder =>
                {
                    builder.WithOrigins("https://localhost:3000")
                           .AllowAnyMethod()
                           .AllowAnyHeader()
                           .AllowCredentials();
                });
            });
            builder.Services.AddSingleton<IAmazonS3>(sp =>
            {
                var config = builder.Configuration.GetSection("Wasabi");
                return new AmazonS3Client(
                    config["AccessKey"],
                    config["SecretKey"],
                    new AmazonS3Config
                    {
                        ServiceURL = config["ServiceUrl"],
                        ForcePathStyle = true
                    });
            });

            // Đăng ký OpenAI client
            builder.Services.AddSingleton(new OpenAIClient(builder.Configuration["OpenAI:ApiKey"]));

            builder.Services.AddHttpContextAccessor();
            //builder scope
            builder.Services.AddScoped<IVideoService>(sp =>
            {
                var s3Client = sp.GetRequiredService<IAmazonS3>();
                var bucketName = builder.Configuration["Wasabi:BucketName"];
                return new VideoService(s3Client, bucketName);
            });
            builder.Services.AddScoped<ICheckProgressServices, CheckProgressServices>();
            builder.Services.AddScoped<ILessonService, LessonService>();
            builder.Services.AddScoped<IManageTopicService, ManageTopicService>();
            builder.Services.AddScoped<IPaidCourseHistoryService, PaidCourseHistoryService>();
            builder.Services.AddScoped<ICourseListService, CourseListService>();
            builder.Services.AddScoped<ICourseService, CourseService>();
            builder.Services.AddScoped<ILessonManageService, LessonManageService>();
            builder.Services.AddScoped<IQuizzListService, QuizzListService>();
            builder.Services.AddScoped<IQuizzService, QuizzService>();
            builder.Services.AddScoped<IBlogService, BlogService>();
            builder.Services.AddScoped<IPublicService, PublicService>();
            builder.Services.AddScoped<IBlogListService, BlogListService>();
            builder.Services.AddScoped<IAccountListService, AccountListService>();
            builder.Services.AddScoped<IModuleListService, ModuleListService>();
            builder.Services.AddScoped<ICourseProgressService, CourseProgressService>();
            builder.Services.AddScoped<IFileService, FileService>();
            builder.Services.AddScoped<IChildrenProgressService, ChildProgressService>();
            builder.Services.AddScoped<IRegisterCourseService, RegisterCourseService>();
            builder.Services.AddScoped<IQuestionAnswerService, QuestionAnswerServices>();
            builder.Services.AddScoped<ICourseTestService, CourseTestService>();
            //login
            builder.Services.AddScoped<IAuthService, AuthService>();
            //register by user
            builder.Services.AddScoped<IAccountService, AccountService>();
            //myProfile
            builder.Services.AddScoped<IMyProfileService, MyProfileService>();
            //use mailtrap.io
            builder.Services.AddScoped<IMailService, MailService>();
            //vn pay
            builder.Services.AddScoped<IVnPayService, VnPayService>();
            // report list function 
            builder.Services.AddScoped<IReportService, ReportService>();
            // thống kê 
            builder.Services.AddScoped<IStat, StatService>();
            // chat bot
            builder.Services.AddHttpClient();
            builder.Services.AddScoped<IChatService, ChatService>();
            // giới hạn số lượng prompt
            //builder.Services.AddScoped<IChatRateLimitService, ChatRateLimitService>();


            //config JWT + middleware + [Authorize]
            var jwtKey = builder.Configuration["Jwt:Key"];
            var jwtIssuer = builder.Configuration["Jwt:Issuer"];

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = false;
                options.SaveToken = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtIssuer,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!))
                };

                // CẤU HÌNH SignalR dùng JWT cho UserIdentifier
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) &&
                            path.StartsWithSegments("/notification-hub"))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            });

            //cấu hình JWT Header
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new() { Title = "ALS API", Version = "v1" });
                c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
                    Name = "Authorization",
                    In = Microsoft.OpenApi.Models.ParameterLocation.Header,
                    Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey
                });
                c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement{
                    {
                        new Microsoft.OpenApi.Models.OpenApiSecurityScheme{
                            Reference = new Microsoft.OpenApi.Models.OpenApiReference{
                                Id = "Bearer",
                                Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme
                            }
                        }, new string[] { }
                    }
                });
            });

            var app = builder.Build();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
                app.UseStaticFiles();
                app.UseHttpsRedirection();
                app.UseCors("CORSPolicy");
                app.UseSession();
                app.UseAuthentication();
                app.UseAuthorization();
                app.MapControllers();
                app.MapHub<NotificationHub>("/notification-hub"); //signalR
                app.Run();
            }
        }
    }
}