using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace ActiveLearningSystem.Model;

public partial class AlsContext : DbContext
{
    public AlsContext()
    {
    }

    public AlsContext(DbContextOptions<AlsContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Account> Accounts { get; set; }

    public virtual DbSet<Answer> Answers { get; set; }

    public virtual DbSet<Blog> Blogs { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<Class> Classes { get; set; }

    public virtual DbSet<Comment> Comments { get; set; }

    public virtual DbSet<Course> Courses { get; set; }

    public virtual DbSet<CoursePayment> CoursePayments { get; set; }

    public virtual DbSet<CourseProgress> CourseProgresses { get; set; }

    public virtual DbSet<CourseStatus> CourseStatuses { get; set; }

    public virtual DbSet<Feedback> Feedbacks { get; set; }

    public virtual DbSet<Lesson> Lessons { get; set; }

    public virtual DbSet<LessonProgress> LessonProgresses { get; set; }

    public virtual DbSet<Module> Modules { get; set; }

    public virtual DbSet<ModuleProgress> ModuleProgresses { get; set; }

    public virtual DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

    public virtual DbSet<Profile> Profiles { get; set; }

    public virtual DbSet<Question> Questions { get; set; }

    public virtual DbSet<Quizz> Quizzs { get; set; }

    public virtual DbSet<QuizzTopic> QuizzTopics { get; set; }

    public virtual DbSet<Report> Reports { get; set; }

    public virtual DbSet<ReportComment> ReportComments { get; set; }

    public virtual DbSet<ReportFile> ReportFiles { get; set; }

    public virtual DbSet<ReportStatus> ReportStatuses { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<Salary> Salaries { get; set; }

    public virtual DbSet<SalaryTable> SalaryTables { get; set; }

    public virtual DbSet<StudentCourse> StudentCourses { get; set; }

    public virtual DbSet<Topic> Topics { get; set; }

    public virtual DbSet<UserAnswer> UserAnswers { get; set; }

    public virtual DbSet<UserQuizz> UserQuizzs { get; set; }

    public virtual DbSet<UserQuizzQuestion> UserQuizzQuestions { get; set; }

    public virtual DbSet<VnPayPayment> VnPayPayments { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Account>(entity =>
        {
            entity.ToTable("Account");

            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Username).HasMaxLength(50);
        });

        modelBuilder.Entity<Answer>(entity =>
        {
            entity.ToTable("Answer");

            entity.HasOne(d => d.Ques).WithMany(p => p.Answers)
                .HasForeignKey(d => d.QuesId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Answer_Question");
        });

        modelBuilder.Entity<Blog>(entity =>
        {
            entity.ToTable("Blog");

            entity.Property(e => e.Content).HasColumnType("ntext");
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Summary).HasColumnType("ntext");
            entity.Property(e => e.Thumbnail).HasMaxLength(200);
            entity.Property(e => e.Title).HasMaxLength(100);

            entity.HasOne(d => d.Author).WithMany(p => p.Blogs)
                .HasForeignKey(d => d.AuthorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Blog_Profile");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("Category");

            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Name).HasMaxLength(20);
        });

        modelBuilder.Entity<Comment>(entity =>
        {
            entity.ToTable("Comment");

            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Author).WithMany(p => p.Comments)
                .HasForeignKey(d => d.AuthorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Comment_Profiles");

            entity.HasOne(d => d.Blog).WithMany(p => p.Comments)
                .HasForeignKey(d => d.BlogId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Comment_Blog");
        });

        modelBuilder.Entity<Course>(entity =>
        {
            entity.ToTable("Course");

            entity.Property(e => e.CourseName).HasMaxLength(100);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Description).HasColumnType("ntext");
            entity.Property(e => e.Image)
                .HasMaxLength(200)
                .IsUnicode(false)
                .HasColumnName("image");
            entity.Property(e => e.Price).HasColumnType("decimal(18, 0)");

            entity.HasOne(d => d.Author).WithMany(p => p.Courses)
                .HasForeignKey(d => d.AuthorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Course_Profiles");

            entity.HasOne(d => d.Category).WithMany(p => p.Courses)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Course_Category");

            entity.HasOne(d => d.Class).WithMany(p => p.Courses)
                .HasForeignKey(d => d.ClassId)
                .HasConstraintName("FK_Course_Classes");
        });

        modelBuilder.Entity<CoursePayment>(entity =>
        {
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 0)");

            entity.HasOne(d => d.StudentCourse).WithMany(p => p.CoursePayments)
                .HasForeignKey(d => d.StudentCourseId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CoursePayments_StudentCourse");
        });

        modelBuilder.Entity<CourseProgress>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_CourseProcess");

            entity.ToTable("CourseProgress");

            entity.HasOne(d => d.CourseStudent).WithMany(p => p.CourseProgresses)
                .HasForeignKey(d => d.CourseStudentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CourseProgress_StudentCourse");
        });

        modelBuilder.Entity<CourseStatus>(entity =>
        {
            entity.ToTable("CourseStatus");
        });

        modelBuilder.Entity<Feedback>(entity =>
        {
            entity.ToTable("Feedback");

            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Rate).HasColumnName("rate");

            entity.HasOne(d => d.Author).WithMany(p => p.Feedbacks)
                .HasForeignKey(d => d.AuthorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Feedback_Profile");

            entity.HasOne(d => d.Course).WithMany(p => p.Feedbacks)
                .HasForeignKey(d => d.CourseId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Feedback_Course");
        });

        modelBuilder.Entity<Lesson>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_Video");

            entity.ToTable("Lesson");

            entity.Property(e => e.Description).HasMaxLength(200);
            entity.Property(e => e.Link).HasMaxLength(200);

            entity.HasOne(d => d.Module).WithMany(p => p.Lessons)
                .HasForeignKey(d => d.ModuleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Lesson_Module");
        });

        modelBuilder.Entity<LessonProgress>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_VideoProgress");

            entity.ToTable("LessonProgress");

            entity.HasOne(d => d.ModuleProgress).WithMany(p => p.LessonProgresses)
                .HasForeignKey(d => d.ModuleProgressId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LessonProgress_ModuleProgress");

            entity.HasOne(d => d.Video).WithMany(p => p.LessonProgresses)
                .HasForeignKey(d => d.VideoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_VideoProgress_Video");
        });

        modelBuilder.Entity<Module>(entity =>
        {
            entity.ToTable("Module");

            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.ModuleName).HasMaxLength(100);

            entity.HasOne(d => d.Course).WithMany(p => p.Modules)
                .HasForeignKey(d => d.CourseId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Module_Course");
        });

        modelBuilder.Entity<ModuleProgress>(entity =>
        {
            entity.ToTable("ModuleProgress");

            entity.HasOne(d => d.CourseProcess).WithMany(p => p.ModuleProgresses)
                .HasForeignKey(d => d.CourseProcessId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ModuleProgress_CourseProgress");

            entity.HasOne(d => d.Module).WithMany(p => p.ModuleProgresses)
                .HasForeignKey(d => d.ModuleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ModuleProgress_Module");
        });

        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Password__3214EC0730B0CA60");

            entity.ToTable("PasswordResetToken");

            entity.Property(e => e.Expiration).HasColumnType("datetime");
            entity.Property(e => e.Token).HasMaxLength(100);

            entity.HasOne(d => d.Account).WithMany(p => p.PasswordResetTokens)
                .HasForeignKey(d => d.AccountId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PasswordResetToken_Account");
        });

        modelBuilder.Entity<Profile>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK_Profile");

            entity.Property(e => e.Address).HasMaxLength(200);
            entity.Property(e => e.Avatar)
                .HasMaxLength(200)
                .IsUnicode(false);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Email).HasMaxLength(50);
            entity.Property(e => e.Name).HasMaxLength(50);
            entity.Property(e => e.Phone)
                .HasMaxLength(50)
                .IsUnicode(false);

            entity.HasOne(d => d.Account).WithMany(p => p.Profiles)
                .HasForeignKey(d => d.AccountId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Profile_Account");

            entity.HasOne(d => d.Parent).WithMany(p => p.InverseParent)
                .HasForeignKey(d => d.ParentId)
                .HasConstraintName("FK_Profiles_Profiles");

            entity.HasOne(d => d.Role).WithMany(p => p.Profiles)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Profiles_Role");
        });

        modelBuilder.Entity<Question>(entity =>
        {
            entity.ToTable("Question");

            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Topic).WithMany(p => p.Questions)
                .HasForeignKey(d => d.TopicId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Question_Topic");
        });

        modelBuilder.Entity<Quizz>(entity =>
        {
            entity.ToTable("Quizz");

            entity.Property(e => e.CreateAt).HasColumnType("datetime");

            entity.HasOne(d => d.Module).WithMany(p => p.Quizzs)
                .HasForeignKey(d => d.ModuleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Quizz_Module");
        });

        modelBuilder.Entity<QuizzTopic>(entity =>
        {
            entity.ToTable("QuizzTopic");

            entity.HasOne(d => d.Quizz).WithMany(p => p.QuizzTopics)
                .HasForeignKey(d => d.QuizzId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_QuizzTopic_Quizz");

            entity.HasOne(d => d.Topic).WithMany(p => p.QuizzTopics)
                .HasForeignKey(d => d.TopicId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_QuizzTopic_Topic");
        });

        modelBuilder.Entity<Report>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Report__3214EC075EB84F9C");


            entity.ToTable("Report");

            entity.Property(e => e.CreatedDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.LastStatusUpdated).HasColumnType("datetime");
            entity.Property(e => e.StatusId).HasDefaultValue(1);
            entity.Property(e => e.Title).HasMaxLength(200);

            entity.HasOne(d => d.Instructor).WithMany(p => p.ReportInstructors)
                .HasForeignKey(d => d.InstructorId)
                .HasConstraintName("FK_Report_Instructor");

            entity.HasOne(d => d.Receiver).WithMany(p => p.ReportReceivers)
                .HasForeignKey(d => d.ReceiverId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Report_Receiver");

            entity.HasOne(d => d.Status).WithMany(p => p.Reports)
                .HasForeignKey(d => d.StatusId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Report_Status");

            entity.HasOne(d => d.User).WithMany(p => p.ReportUsers)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Report_User");
        });

        modelBuilder.Entity<ReportComment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ReportCo__3214EC076C7844E4");


            entity.ToTable("ReportComment");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.Report).WithMany(p => p.ReportComments)
                .HasForeignKey(d => d.ReportId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ReportComment_Report");

            entity.HasOne(d => d.User).WithMany(p => p.ReportComments)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ReportComment_User");
        });

        modelBuilder.Entity<ReportFile>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ReportFi__3214EC07BCD6D371");


            entity.ToTable("ReportFile");

            entity.Property(e => e.FilePath).HasMaxLength(300);
            entity.Property(e => e.UploadedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.Report).WithMany(p => p.ReportFiles)
                .HasForeignKey(d => d.ReportId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ReportFile_Report");
        });

        modelBuilder.Entity<ReportStatus>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ReportSt__3214EC07EFD06F9D");

            entity.ToTable("ReportStatus");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Name).HasMaxLength(50);
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("Role");

            entity.Property(e => e.Name).HasMaxLength(20);
        });

        modelBuilder.Entity<Salary>(entity =>
        {
            entity.ToTable("Salary");

            entity.Property(e => e.Salary1)
                .HasColumnType("decimal(18, 0)")
                .HasColumnName("Salary");

            entity.HasOne(d => d.User).WithMany(p => p.Salaries)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Salary_Profile");
        });

        modelBuilder.Entity<SalaryTable>(entity =>
        {
            entity.ToTable("SalaryTable");

            entity.Property(e => e.Content).HasMaxLength(200);

            entity.HasOne(d => d.User).WithMany(p => p.SalaryTables)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SalaryTable_Profile");
        });

        modelBuilder.Entity<StudentCourse>(entity =>
        {
            entity.ToTable("StudentCourse");

            entity.HasOne(d => d.Course).WithMany(p => p.StudentCourses)
                .HasForeignKey(d => d.CourseId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_StudentCourse_Course");

            entity.HasOne(d => d.Pupil).WithMany(p => p.StudentCourses)
                .HasForeignKey(d => d.PupilId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_StudentCourse_Profiles");

            entity.HasOne(d => d.StatusNavigation).WithMany(p => p.StudentCourses)
                .HasForeignKey(d => d.Status)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_StudentCourse_CourseStatus");
        });

        modelBuilder.Entity<Topic>(entity =>
        {
            entity.ToTable("Topic");

            entity.HasOne(d => d.Category).WithMany(p => p.Topics)
                .HasForeignKey(d => d.CategoryId)
                .HasConstraintName("FK_Topic_Category");

            entity.HasOne(d => d.Class).WithMany(p => p.Topics)
                .HasForeignKey(d => d.ClassId)
                .HasConstraintName("FK_Topic_Classes");
        });

        modelBuilder.Entity<UserAnswer>(entity =>
        {
            entity.ToTable("UserAnswer");

            entity.Property(e => e.AnswerAt).HasColumnType("datetime");

            entity.HasOne(d => d.Answer).WithMany(p => p.UserAnswers)
                .HasForeignKey(d => d.AnswerId)
                .HasConstraintName("FK_UserAnswer_Answer");

            entity.HasOne(d => d.Question).WithMany(p => p.UserAnswers)
                .HasForeignKey(d => d.QuestionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UserAnswer_Question");

            entity.HasOne(d => d.UserQuizz).WithMany(p => p.UserAnswers)
                .HasForeignKey(d => d.UserQuizzId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UserAnswer_UserQuizz");
        });

        modelBuilder.Entity<UserQuizz>(entity =>
        {
            entity.ToTable("UserQuizz");

            entity.Property(e => e.StartAt).HasColumnType("datetime");
            entity.Property(e => e.SubmitAt).HasColumnType("datetime");

            entity.HasOne(d => d.ModuleProgress).WithMany(p => p.UserQuizzs)
                .HasForeignKey(d => d.ModuleProgressId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UserQuizz_ModuleProgress");

            entity.HasOne(d => d.Quiz).WithMany(p => p.UserQuizzs)
                .HasForeignKey(d => d.QuizId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UserQuizz_Quizz");
        });

        modelBuilder.Entity<UserQuizzQuestion>(entity =>
        {
            entity.ToTable("UserQuizzQuestion");

            entity.HasOne(d => d.Queestion).WithMany(p => p.UserQuizzQuestions)
                .HasForeignKey(d => d.Queestionid)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UserQuizzQuestion_Question");

            entity.HasOne(d => d.UserQuiz).WithMany(p => p.UserQuizzQuestions)
                .HasForeignKey(d => d.UserQuizId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UserQuizzQuestion_UserQuizz");
        });

        modelBuilder.Entity<VnPayPayment>(entity =>
        {
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.BankCode).HasMaxLength(50);
            entity.Property(e => e.CardType).HasMaxLength(20);
            entity.Property(e => e.OrderInfo).HasMaxLength(255);
            entity.Property(e => e.ResponseCode).HasMaxLength(10);
            entity.Property(e => e.SecureHash).HasMaxLength(255);
            entity.Property(e => e.TransactionId).HasMaxLength(100);
            entity.Property(e => e.TransactionStatus)
                .HasMaxLength(10)
                .HasDefaultValue("pending");

            entity.HasOne(d => d.CoursePayment).WithMany(p => p.VnPayPayments)
                .HasForeignKey(d => d.CoursePaymentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_VnPayPayments_CoursePayments");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
