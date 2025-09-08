namespace ActiveLearningSystem.Payment
{
    public class VnPayPaymentVM
    {
        public int Id { get; set; }
        public string TransactionId { get; set; } = null!;
        public string OrderInfo { get; set; } = null!;
        public decimal Amount { get; set; }
        public string BankCode { get; set; } = null!;
        public string CardType { get; set; } = null!;
        public string ResponseCode { get; set; } = null!;
        public string SecureHash { get; set; } = null!;
        public string TransactionStatus { get; set; } = null!;
        public DateOnly PaidDate { get; set; }

    }
}
