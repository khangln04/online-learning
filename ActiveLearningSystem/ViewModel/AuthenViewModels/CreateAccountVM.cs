
﻿using ActiveLearningSystem.ViewModel.AdminViewModels;


namespace ActiveLearningSystem.ViewModel.AuthenViewModels
{

    public class CreateAccountVM
    {
        public string Name { get; set; }
        public string Address { get; set; }
        public DateOnly Dob { get; set; }
        public Gender Sex { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public int RoleId { get; set; } // 6: Pupil, 7: Parent

        //public string? ParentEmail { get; set; } // Nếu là con thì nhập email cha mẹ
        //public string? PupilEmail { get; set; } // Nếu là parent thì nhập email con (nếu biết)

        public string Username { get; set; }
        public string Password { get; set; }
    }
}
