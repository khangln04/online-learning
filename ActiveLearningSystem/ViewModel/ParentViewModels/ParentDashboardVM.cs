using ActiveLearningSystem.ViewModel.ParentViewModels;
using ActiveLearningSystem.ViewModel.PublicViewModels;
using System.Collections.Generic;

namespace ActiveLearningSystem.ViewModel.ManagerViewModels
{
    public class ParentDashboardVM
    {
        public List<MyProfileVM> Children { get; set; }
        public List<ChildProgressDetailVM> ChildProgressDetails { get; set; }
    }
}