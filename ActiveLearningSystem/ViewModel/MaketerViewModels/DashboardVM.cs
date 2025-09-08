// File: ViewModel/MaketerViewModels/DashboardVM.cs
using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.ViewModel.MaketerViewModels
{
    public class DashboardVM
    {
        public int TotalCourses { get; set; }
        public int PublishedCourses { get; set; }
        public int TotalPupils { get; set; }
        public List<CourseListItemVM> Courses { get; set; } = new();
    }

    public class CourseListItemVM
    {
        public int CourseId { get; set; }
        public string CourseName { get; set; } = "";
        public decimal Price { get; set; }
        public bool Status { get; set; }
        public DateTime CreatedDate { get; set; }
        public string Description { get; set; } = "";   // ✅ thêm mô tả
    }
}
