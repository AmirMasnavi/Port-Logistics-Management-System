using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace PortProject.Api.Services
{
    public interface IEmailService
    {
        Task SendActivationEmailAsync(string toEmail, string activationLink);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendActivationEmailAsync(string toEmail, string activationLink)
        {
            var smtpSettings = _configuration.GetSection("SmtpSettings");
            string fromEmail = smtpSettings["SenderEmail"] ?? "noreply@portauthority.com";
            string password = smtpSettings["Password"];
            string host = smtpSettings["Host"];
            int port = int.Parse(smtpSettings["Port"] ?? "587");

            // 1. Construct the email body
            string subject = "Welcome to Port Authority - Activate your account";
            string body = $@"
                <h1>Welcome!</h1>
                <p>You have been invited to join the Port Authority System.</p>
                <p>Please click the link below to activate your account:</p>
                <p><a href='{activationLink}'>Activate Account</a></p>
                <br/>
                <p>If the link doesn't work, copy this URL:</p>
                <p>{activationLink}</p>";

            // 2. Try to send REAL email
            if (!string.IsNullOrEmpty(password) && !string.IsNullOrEmpty(host))
            {
                try
                {
                    var client = new SmtpClient(host, port)
                    {
                        Credentials = new NetworkCredential(fromEmail, password),
                        EnableSsl = true
                    };

                    var mailMessage = new MailMessage(fromEmail, toEmail, subject, body)
                    {
                        IsBodyHtml = true
                    };

                    await client.SendMailAsync(mailMessage);
                    _logger.LogInformation($"✅ Email sent to {toEmail}");
                    return;
                }
                catch (Exception ex)
                {
                    _logger.LogError($"❌ Failed to send email: {ex.Message}");
                    // Fallback to console below...
                }
            }

            // 3. PROTOTYPE FALLBACK: Print to Console
            // This ensures you can ALWAYS verify the feature works, even without an SMTP server.
            _logger.LogWarning("⚠️ SMTP not configured. Printing email to console.");
            Console.WriteLine("================= [EMAIL SIMULATION] =================");
            Console.WriteLine($"TO: {toEmail}");
            Console.WriteLine($"SUBJECT: {subject}");
            Console.WriteLine($"LINK: {activationLink}");
            Console.WriteLine("======================================================");
        }
    }
}