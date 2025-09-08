namespace ActiveLearningSystem.Payment
{
    public interface IVnPayService
    {
        string CreatePaymentUrl(int parentUserId, int coursePaymentId, HttpContext context);
        CoursePaymentVM PaymentExecute(IQueryCollection collections);
    }

}
