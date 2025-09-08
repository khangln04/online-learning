using System.Net.Sockets;
using System.Net;
using System.Text;
using System.Security.Cryptography;
using System.Globalization;

namespace ActiveLearningSystem.Payment
{
    public class VnPayLibrary
    {
        private readonly SortedList<string, string> _requestData = new(new VnPayCompare());
        private readonly SortedList<string, string> _responseData = new(new VnPayCompare());

        public CoursePaymentVM GetFullResponseData(IQueryCollection collection, string hashSecret)
        {
            foreach (var (key, value) in collection)
            {
                if (!string.IsNullOrEmpty(key) && key.StartsWith("vnp_"))
                {
                    _responseData.Add(key, value);
                }
            }

            var txnRefString = GetResponseData("vnp_TxnRef");
            var parts = txnRefString.Split('-');

            if (parts.Length < 2 || !int.TryParse(parts[0], out var orderId))
            {
                return new CoursePaymentVM
                {
                    Id = 0,
                    IsPaid = false,
                    PaidAt = null,
                    VnPayPayments = new List<VnPayPaymentVM>
                    {
                        new VnPayPaymentVM
                        {
                            ResponseCode = "Invalid_TxnRef",
                            PaidDate = DateOnly.FromDateTime(DateTime.Now)
                        }
                    }
                };
            }


            var checkSignature = ValidateSignature(collection["vnp_SecureHash"], hashSecret);

            var transactionStatus = GetResponseData("vnp_TransactionStatus");
            var responseCode = GetResponseData("vnp_ResponseCode");

            var isSuccess = checkSignature && responseCode == "00" && transactionStatus == "00";

            return new CoursePaymentVM
            {
                Id = orderId, 
                IsPaid = isSuccess,
                PaidAt = isSuccess ? DateOnly.FromDateTime(DateTime.Now) : null,
                VnPayPayments = new List<VnPayPaymentVM>
                {
                    new VnPayPaymentVM
                    {
                        TransactionId = GetResponseData("vnp_TransactionNo"),
                        OrderInfo = GetResponseData("vnp_OrderInfo"),
                        Amount = decimal.Parse(GetResponseData("vnp_Amount")) / 100,
                        BankCode = GetResponseData("vnp_BankCode"),
                        CardType = GetResponseData("vnp_CardType"),
                        ResponseCode = responseCode,
                        TransactionStatus = transactionStatus, 
                        SecureHash = collection["vnp_SecureHash"],
                        PaidDate = DateOnly.FromDateTime(DateTime.Now)
                    }
                }
            };
        }

        public void AddRequestData(string key, string value)
        {
            if (!string.IsNullOrEmpty(value))
            {
                _requestData.Add(key, value);
            }
        }

        public string GetResponseData(string key)
        {
            return _responseData.TryGetValue(key, out var value) ? value : string.Empty;
        }

        public string CreateRequestUrl(string baseUrl, string vnpHashSecret)
        {
            var query = string.Join("&", _requestData.Select(kv =>
                $"{WebUtility.UrlEncode(kv.Key)}={WebUtility.UrlEncode(kv.Value)}"));

            var secureHash = HmacSha512(vnpHashSecret, query);
            return $"{baseUrl}?{query}&vnp_SecureHash={secureHash}";
        }

        public bool ValidateSignature(string inputHash, string secretKey)
        {
            var rawData = string.Join("&", _responseData
                .Where(kv => kv.Key != "vnp_SecureHash" && kv.Key != "vnp_SecureHashType")
                .Select(kv => $"{WebUtility.UrlEncode(kv.Key)}={WebUtility.UrlEncode(kv.Value)}"));

            var computedHash = HmacSha512(secretKey, rawData);
            return computedHash.Equals(inputHash, StringComparison.OrdinalIgnoreCase);
        }

        private string HmacSha512(string key, string data)
        {
            using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(key));
            var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
        }
    }

    public class VnPayCompare : IComparer<string>
    {
        public int Compare(string x, string y) =>
            string.Compare(x, y, StringComparison.Ordinal);
    }
}


