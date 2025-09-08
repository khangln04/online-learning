using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class Account
{
    public int Id { get; set; }

    public string Username { get; set; } = null!;

    public string Password { get; set; } = null!;

    public bool Status { get; set; }

    public DateOnly CreatedDate { get; set; }

    public DateOnly? UpdatedDate { get; set; }

    public bool IsVerified { get; set; }

    public virtual ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = new List<PasswordResetToken>();

    public virtual ICollection<Profile> Profiles { get; set; } = new List<Profile>();
}
