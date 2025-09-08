using ActiveLearningSystem.Model;
using ActiveLearningSystem.Services.InstructorServices;
using ActiveLearningSystem.ViewModel.InstructorViewModels;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

public class QuestionAnswerServices : IQuestionAnswerService
{
    private readonly AlsContext _context;
    private readonly IMapper _mapper;
    public QuestionAnswerServices(AlsContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public (List<QuestionListVM> Questions, int TotalRecords, int TotalPages) GetQuestions(
        int pageIndex = 1,
        string? keyword = null,
        int? topicId = null,
        int pageSize = 10)
    {
        if (pageIndex < 1) pageIndex = 1;
        if (pageSize < 1) pageSize = 5;

        var query = _context.Questions
            .Include(c => c.Answers)
            .Include(c => c.Topic)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var cleanKeyword = keyword.Trim();
            query = query.Where(c => EF.Functions.Like(c.Content, $"%{cleanKeyword}%"));
        }

        if (topicId != null)
            query = query.Where(c => c.TopicId == topicId);

        query = query.OrderByDescending(c => c.CreatedDate);
        int totalRecords = query.Count();

        var pagedQuestion = query
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var questionVMs = _mapper.Map<List<QuestionListVM>>(pagedQuestion);
        int totalPages = (int)Math.Ceiling(totalRecords / (double)pageSize);

        return (questionVMs, totalRecords, totalPages);
    }

    public QuestionListVM? GetQuestionDetail(int questionId)
    {
        var question = _context.Questions
            .Include(q => q.Answers)
            .Include(q => q.Topic)
            .FirstOrDefault(q => q.Id == questionId);

        return question == null ? null : _mapper.Map<QuestionListVM>(question);
    }

    public async Task<bool> AddQuestionAsync(QuestionCreateVM questionVM, List<AnswerCreateVM> answerVMs)
    {
        if (answerVMs.Count != 4)
            throw new Exception("❌ Mỗi câu hỏi phải có đúng 4 đáp án.");

        int correctCount = answerVMs.Count(a => a.IsCorrect);
        if (correctCount != 1)
            throw new Exception("❌ Mỗi câu hỏi phải có đúng 1 đáp án đúng.");

        // Chỉ chặn nếu tất cả đáp án giống hệt nhau
        bool allSameAnswers = answerVMs
            .Select(a => a.Content.Trim().ToLower())
            .Distinct()
            .Count() == 1;
        if (allSameAnswers)
            throw new Exception("❌ Không được để tất cả đáp án giống nhau.");

        // Lấy danh sách câu hỏi cùng topic và nội dung giống nhau
        var potentialDuplicates = await _context.Questions
            .Include(q => q.Answers)
            .Where(q => q.Content.Trim().ToLower() == questionVM.Content.Trim().ToLower()
                     && q.TopicId == questionVM.TopicId)
            .ToListAsync();

        foreach (var dup in potentialDuplicates)
        {
            var dupAnswers = dup.Answers
                .Select(a => new { Content = a.Content.Trim().ToLower(), a.IsCorrect })
                .OrderBy(a => a.Content)
                .ToList();

            var newAnswers = answerVMs
                .Select(a => new { Content = a.Content.Trim().ToLower(), a.IsCorrect })
                .OrderBy(a => a.Content)
                .ToList();

            if (dupAnswers.Count == newAnswers.Count &&
                !dupAnswers.Where((t, i) => t.Content != newAnswers[i].Content || t.IsCorrect != newAnswers[i].IsCorrect).Any())
            {
                throw new Exception("❌ Câu hỏi cùng chủ đề với đáp án trùng đã tồn tại.");
            }
        }

        var question = new Question
        {
            Content = questionVM.Content.Trim(),
            TopicId = questionVM.TopicId,
            CreatedDate = DateOnly.FromDateTime(DateTime.Now)
        };

        _context.Questions.Add(question);
        await _context.SaveChangesAsync();

        var answers = answerVMs.Select(a => new Answer
        {
            QuesId = question.Id,
            Content = a.Content.Trim(),
            IsCorrect = a.IsCorrect
        }).ToList();

        _context.Answers.AddRange(answers);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> UpdateQuestionAsync(int questionId, QuestionCreateVM questionVM, List<AnswerCreateVM> answerVMs)
    {
        var question = await _context.Questions
            .Include(q => q.Answers)
            .FirstOrDefaultAsync(q => q.Id == questionId);

        if (question == null)
            throw new Exception("❌ Không tìm thấy câu hỏi.");

        if (answerVMs.Count != 4)
            throw new Exception("❌ Mỗi câu hỏi phải có đúng 4 đáp án.");

        if (answerVMs.Count(a => a.IsCorrect) != 1)
            throw new Exception("❌ Mỗi câu hỏi phải có đúng 1 đáp án đúng.");

        if (answerVMs.Select(a => a.Content.Trim().ToLower()).Distinct().Count() == 1)
            throw new Exception("❌ Không được để tất cả đáp án giống nhau.");

        // Kiểm tra trùng hoàn toàn trong chủ đề mới
        var potentialDuplicates = await _context.Questions
            .Include(q => q.Answers)
            .Where(q => q.Id != questionId
                     && q.Content.Trim().ToLower() == questionVM.Content.Trim().ToLower()
                     && q.TopicId == questionVM.TopicId)
            .ToListAsync();

        var newAnswers = answerVMs
            .Select(a => new { Content = a.Content.Trim().ToLower(), a.IsCorrect })
            .OrderBy(a => a.Content)
            .ToList();

        foreach (var dup in potentialDuplicates)
        {
            var dupAnswers = dup.Answers
                .Select(a => new { Content = a.Content.Trim().ToLower(), a.IsCorrect })
                .OrderBy(a => a.Content)
                .ToList();

            if (dupAnswers.SequenceEqual(newAnswers))
                throw new Exception("❌ Câu hỏi cùng chủ đề với đáp án trùng đã tồn tại.");
        }

        // Cập nhật nội dung & chủ đề
        question.Content = questionVM.Content.Trim();
        question.TopicId = questionVM.TopicId;

        // Xóa đáp án cũ & thêm mới
        _context.Answers.RemoveRange(question.Answers);
        _context.Answers.AddRange(answerVMs.Select(a => new Answer
        {
            QuesId = questionId,
            Content = a.Content.Trim(),
            IsCorrect = a.IsCorrect
        }));

        await _context.SaveChangesAsync();
        return true;
    }




    public async Task<bool> DeleteQuestionAsync(int questionId)
    {
        var question = await _context.Questions
            .Include(q => q.Answers)
            .FirstOrDefaultAsync(q => q.Id == questionId);

        if (question == null)
            throw new Exception("❌ Không tìm thấy câu hỏi.");

        _context.Answers.RemoveRange(question.Answers);
        _context.Questions.Remove(question);
        await _context.SaveChangesAsync();

        return true;
    }
}
