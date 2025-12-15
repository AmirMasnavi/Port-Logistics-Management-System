using Microsoft.AspNetCore.Mvc;
using PortProject.Api.Application.PrivacyPolicy.Services;
using PortProject.Api.Application.PrivacyPolicy.DTOs;

namespace PortProject.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SetupPrivacyPolicyController : ControllerBase
    {
        private readonly IPrivacyPolicyService _privacyPolicyService;

        public SetupPrivacyPolicyController(IPrivacyPolicyService privacyPolicyService)
        {
            _privacyPolicyService = privacyPolicyService;
        }

        [HttpPost("create-initial")]
        public async Task<IActionResult> CreateInitialPolicy()
        {
            var content = @"# PORT MANAGEMENT SYSTEM - PRIVACY POLICY

## 1. INTRODUCTION
Welcome to the Port Management System. This Privacy Policy explains how we collect, use, store, and protect your personal data in compliance with the GDPR (EU) 2016/679.

**Data Controller:** Port Management System | **DPO Email:** dpo@portsystem.com

## 2. DATA WE COLLECT
### 2.1 Personal Information
- Full name, Email, Phone number
- Employee/User ID, Job role, Department
- Professional qualifications

### 2.2 Account Information
- Username, Password (encrypted), Authentication tokens
- Login history and timestamps

### 2.3 Professional Data
- Shipping agent information, Vessel information
- Operational data, Resource allocation

### 2.4 Technical Data
- IP address, Browser type, Device information
- Cookie data, System logs

## 3. LEGAL BASIS FOR PROCESSING
- **Contract Performance:** Fulfill contractual obligations
- **Legal Obligation:** Maritime and port regulations compliance
- **Legitimate Interest:** System security, fraud prevention
- **Consent:** Explicitly provided for specific purposes

## 4. HOW WE USE YOUR DATA
- Provide access to port management system
- Manage port operations and vessel scheduling
- System updates and notifications
- Ensure security and prevent unauthorized access
- Comply with legal requirements
- Improve services and user experience
- Generate operational reports

## 5. DATA SHARING
We may share data with:
- **Port Authorities:** Maritime regulations
- **Shipping Companies:** Operational coordination
- **Government Agencies:** Legal requirements
- **IT Service Providers:** System maintenance

**WE DO NOT SELL YOUR DATA TO THIRD PARTIES**

## 6. YOUR GDPR RIGHTS
### 6.1 Right to Access (Article 15)
Request access to your personal data and processing information.

### 6.2 Right to Rectification (Article 16)
Request correction of inaccurate or incomplete data.

### 6.3 Right to Erasure (Article 17)
Request deletion of your personal data.

### 6.4 Right to Restrict Processing (Article 18)
Request limitation of data processing.

### 6.5 Right to Data Portability (Article 20)
Receive data in structured, machine-readable format.

### 6.6 Right to Object (Article 21)
Object to data processing based on legitimate interests.

### 6.7 Right to Withdraw Consent
Withdraw consent at any time.

### 6.8 Right to Lodge a Complaint
File complaint with data protection authority.

**Contact DPO:** dpo@portsystem.com

## 7. DATA RETENTION
- **Active Users:** Employment duration + 3 years
- **Inactive Accounts:** 12 months after last activity
- **Operational Logs:** 2 years
- **Legal Compliance:** As required by law

## 8. DATA SECURITY
- **Encryption:** TLS/SSL in transit, encrypted at rest
- **Access Control:** Role-based with strong authentication
- **Audit Trails:** Comprehensive activity logging
- **Security Testing:** Regular vulnerability assessments
- **Staff Training:** Data protection training
- **Incident Response:** 72-hour breach notification

## 9. INTERNATIONAL DATA TRANSFERS
- European Commission adequacy decisions
- Standard Contractual Clauses (SCCs)
- GDPR Article 46 safeguards

## 10. COOKIES AND TRACKING
- **Essential Cookies:** Authentication and security
- **Functional Cookies:** User experience
- **Analytics Cookies:** Usage statistics (anonymized)

## 11. DATA BREACH NOTIFICATION
- Supervisory authority notification within 72 hours
- Affected individuals informed without delay
- Full breach documentation and remedial actions

## 12. CHILDREN PRIVACY
System not intended for individuals under 16 years.

## 13. AUTOMATED DECISION-MAKING
No automated decision-making or profiling with legal effects.

## 14. CHANGES TO POLICY
Updates communicated with notification to review and accept.

**Last Updated:** December 12, 2025 | **Version:** 1.0

## 15. CONTACT INFORMATION
**Data Protection Officer:** dpo@portsystem.com
**General Inquiries:** privacy@portsystem.com
**Supervisory Authority:** National Data Protection Authority

## 16. ACCEPTANCE
By using this system, you acknowledge reading, understanding, and agreeing to this Privacy Policy.

---

**GDPR COMPLIANCE STATEMENT**
This Privacy Policy complies with EU Regulation 2016/679 and Articles 13-14 GDPR.

**Your Rights Summary:**
✅ Right to be informed
✅ Right of access
✅ Right to rectification
✅ Right to erasure
✅ Right to restrict processing
✅ Right to data portability
✅ Right to object
✅ Rights related to automated decision-making

**Contact DPO for questions or to exercise rights: dpo@portsystem.com**";

            var dto = new CreatePrivacyPolicyDto
            {
                Title = "Privacy Policy v1.0",
                Content = content,
                ChangeReason = "Initial comprehensive GDPR-compliant privacy policy"
            };

            try
            {
                var policy = await _privacyPolicyService.CreateAndPublishPolicyAsync(dto, "admin-system");
                return Ok(new { message = "Privacy policy created successfully!", policy });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating policy", error = ex.Message });
            }
        }
    }
}
