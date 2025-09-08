using System;
using System.Collections.Generic;

namespace ActiveLearningSystem.Model;

public partial class VnPayPayment
{
    public int Id { get; set; }

    public int CoursePaymentId { get; set; }

    public string TransactionId { get; set; } = null!;

    public string OrderInfo { get; set; } = null!;

    public decimal Amount { get; set; }

    public string BankCode { get; set; } = null!;

    public string CardType { get; set; } = null!;

    public string ResponseCode { get; set; } = null!;

    public string SecureHash { get; set; } = null!;

    public DateOnly PaidDate { get; set; }

    public string TransactionStatus { get; set; } = null!;

    public virtual CoursePayment CoursePayment { get; set; } = null!;
}
