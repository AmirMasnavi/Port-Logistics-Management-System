using Microsoft.EntityFrameworkCore;
using PortProject.Api.Application.DataRights.DTOs;
using PortProject.Api.Domain.DataRightsAggregate;
using PortProject.Api.Domain.StaffMemberAggregate;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using PortProject.Api.Models;
using System.Text;

namespace PortProject.Api.Application.DataRights.Services;

public class DataRightsService : IDataRightsService
{
    private readonly IDataRightsRequestRepository _requestRepository;
    private readonly PortProjectContext _context;
    private readonly IShippingAgentRepresentativeRepository _representativeRepository;
    private readonly ILogger<DataRightsService> _logger;

    public DataRightsService(
        IDataRightsRequestRepository requestRepository,
        PortProjectContext context,
        IShippingAgentRepresentativeRepository representativeRepository,
        ILogger<DataRightsService> logger)
    {
        _requestRepository = requestRepository;
        _context = context;
        _representativeRepository = representativeRepository;
        _logger = logger;
    }

    public async Task<DataRightsRequestDto> CreateRequestAsync(string userEmail, CreateDataRightsRequestDto dto)
    {
        if (!Enum.TryParse<DataRightsRequestType>(dto.RequestType, out var requestType))
        {
            throw new ArgumentException($"Invalid request type: {dto.RequestType}");
        }

        var request = new DataRightsRequest(userEmail, requestType, dto.Details);
        await _requestRepository.AddAsync(request);

        _logger.LogInformation("Data rights request created: {RequestId} for user {Email} of type {Type}", 
            request.Id, userEmail, requestType);

        return MapToDto(request);
    }

    public async Task<UserPersonalDataDto> GetUserPersonalDataAsync(string userEmail)
    {
        var normalizedEmail = userEmail.ToLowerInvariant();

        var appUser = await _context.AppUsers
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        if (appUser == null)
        {
            throw new InvalidOperationException("User not found");
        }

        var userData = new UserPersonalDataDto
        {
            Email = appUser.Email,
            Role = appUser.Role.ToString(),
            Status = appUser.Status.ToString()
        };

        // Get staff member data if applicable
        var staffMember = await _context.StaffMembers
            .Include(sm => sm.Qualifications)
            .FirstOrDefaultAsync(sm => sm.ContactDetails.Email == normalizedEmail);

        if (staffMember != null)
        {
            userData.StaffMemberData = new StaffMemberDataDto
            {
                MecanographicNumber = staffMember.MecanographicNumber.Value,
                ShortName = staffMember.ShortName,
                Email = staffMember.ContactDetails.Email,
                Phone = staffMember.ContactDetails.Phone,
                Qualifications = staffMember.Qualifications.Select(q => q.Name.Value).ToList(),
                CurrentStatus = staffMember.CurrentStatus.ToString()
            };
        }

        // Get shipping agent representative data if applicable
        var representative = await _representativeRepository.GetByEmailAsync(new RepresentativeEmail(normalizedEmail));
        if (representative != null)
        {
            userData.ShippingAgentRepresentativeData = new ShippingAgentRepresentativeDataDto
            {
                RepresentativeId = representative.RepresentativeId.Value.ToString(),
                CitizenId = representative.CitizenId.Value,
                Name = representative.RepresentativeName.Value,
                Email = representative.RepresentativeEmail.Value,
                Phone = representative.RepresentativePhone.Value,
                Nationality = representative.RepresentativeNationality.Value,
                OrganizationId = representative.OrganizationId?.Value.ToString()
            };
        }

        // Get policy acknowledgments
        var acknowledgments = await _context.UserPolicyAcknowledgments
            .Where(a => a.UserEmail == normalizedEmail)
            .OrderByDescending(a => a.AcknowledgedAt)
            .ToListAsync();

        userData.PolicyAcknowledgments = acknowledgments.Select(a => new PolicyAcknowledgmentDataDto
        {
            PolicyVersion = a.PolicyVersion,
            AcknowledgedAt = a.AcknowledgedAt
        }).ToList();

        return userData;
    }

    public async Task<List<DataRightsRequestDto>> GetUserRequestsAsync(string userEmail)
    {
        var requests = await _requestRepository.GetByUserEmailAsync(userEmail);
        return requests.Select(MapToDto).ToList();
    }

    public async Task<byte[]> GeneratePersonalDataPdfAsync(string userEmail)
    {
        var userData = await GetUserPersonalDataAsync(userEmail);
        
        // Simple PDF generation using plain text
        var sb = new StringBuilder();
        sb.AppendLine("=================================================");
        sb.AppendLine("        PERSONAL DATA REPORT (GDPR)");
        sb.AppendLine("=================================================");
        sb.AppendLine();
        sb.AppendLine($"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
        sb.AppendLine($"User Email: {userData.Email}");
        sb.AppendLine();
        sb.AppendLine("=================================================");
        sb.AppendLine("        USER ACCOUNT INFORMATION");
        sb.AppendLine("=================================================");
        sb.AppendLine($"Role: {userData.Role}");
        sb.AppendLine($"Status: {userData.Status}");
        sb.AppendLine();

        if (userData.StaffMemberData != null)
        {
            sb.AppendLine("=================================================");
            sb.AppendLine("        STAFF MEMBER DATA");
            sb.AppendLine("=================================================");
            sb.AppendLine($"Mecanographic Number: {userData.StaffMemberData.MecanographicNumber}");
            sb.AppendLine($"Short Name: {userData.StaffMemberData.ShortName}");
            sb.AppendLine($"Email: {userData.StaffMemberData.Email}");
            sb.AppendLine($"Phone: {userData.StaffMemberData.Phone}");
            sb.AppendLine($"Status: {userData.StaffMemberData.CurrentStatus}");
            sb.AppendLine($"Qualifications: {string.Join(", ", userData.StaffMemberData.Qualifications)}");
            sb.AppendLine();
        }

        if (userData.ShippingAgentRepresentativeData != null)
        {
            sb.AppendLine("=================================================");
            sb.AppendLine("        SHIPPING AGENT REPRESENTATIVE DATA");
            sb.AppendLine("=================================================");
            sb.AppendLine($"Representative ID: {userData.ShippingAgentRepresentativeData.RepresentativeId}");
            sb.AppendLine($"Citizen ID: {userData.ShippingAgentRepresentativeData.CitizenId}");
            sb.AppendLine($"Name: {userData.ShippingAgentRepresentativeData.Name}");
            sb.AppendLine($"Email: {userData.ShippingAgentRepresentativeData.Email}");
            sb.AppendLine($"Phone: {userData.ShippingAgentRepresentativeData.Phone}");
            sb.AppendLine($"Nationality: {userData.ShippingAgentRepresentativeData.Nationality}");
            if (!string.IsNullOrEmpty(userData.ShippingAgentRepresentativeData.OrganizationId))
            {
                sb.AppendLine($"Organization ID: {userData.ShippingAgentRepresentativeData.OrganizationId}");
            }
            sb.AppendLine();
        }

        if (userData.PolicyAcknowledgments.Any())
        {
            sb.AppendLine("=================================================");
            sb.AppendLine("        PRIVACY POLICY ACKNOWLEDGMENTS");
            sb.AppendLine("=================================================");
            foreach (var ack in userData.PolicyAcknowledgments)
            {
                sb.AppendLine($"Version {ack.PolicyVersion}: {ack.AcknowledgedAt:yyyy-MM-dd HH:mm:ss}");
            }
            sb.AppendLine();
        }

        sb.AppendLine("=================================================");
        sb.AppendLine("               END OF REPORT");
        sb.AppendLine("=================================================");

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private DataRightsRequestDto MapToDto(DataRightsRequest request)
    {
        return new DataRightsRequestDto
        {
            Id = request.Id,
            UserEmail = request.UserEmail,
            RequestType = request.RequestType.ToString(),
            Details = request.Details,
            Status = request.Status.ToString(),
            RequestedAt = request.RequestedAt,
            ProcessedAt = request.ProcessedAt,
            ProcessedBy = request.ProcessedBy,
            Response = request.Response
        };
    }
}
