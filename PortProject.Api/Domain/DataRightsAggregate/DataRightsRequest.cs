namespace PortProject.Api.Domain.DataRightsAggregate;

public class DataRightsRequest
{
    public Guid Id { get; private set; }
    public string UserEmail { get; private set; }
    public DataRightsRequestType RequestType { get; private set; }
    public string? Details { get; private set; }
    public DataRightsRequestStatus Status { get; private set; }
    public DateTime RequestedAt { get; private set; }
    public DateTime? ProcessedAt { get; private set; }
    public string? ProcessedBy { get; private set; }
    public string? Response { get; private set; }

    private DataRightsRequest() { } // For EF Core

    public DataRightsRequest(string userEmail, DataRightsRequestType requestType, string? details = null)
    {
        if (string.IsNullOrWhiteSpace(userEmail))
            throw new ArgumentException("User email is required.", nameof(userEmail));

        Id = Guid.NewGuid();
        UserEmail = userEmail.ToLowerInvariant();
        RequestType = requestType;
        Details = details;
        Status = DataRightsRequestStatus.Pending;
        RequestedAt = DateTime.UtcNow;
    }

    public void MarkAsProcessed(string processedBy, string? response = null)
    {
        Status = DataRightsRequestStatus.Processed;
        ProcessedAt = DateTime.UtcNow;
        ProcessedBy = processedBy;
        Response = response;
    }

    public void MarkAsRejected(string processedBy, string reason)
    {
        Status = DataRightsRequestStatus.Rejected;
        ProcessedAt = DateTime.UtcNow;
        ProcessedBy = processedBy;
        Response = reason;
    }
}

public enum DataRightsRequestType
{
    DataAccess,      // Request a copy of personal data
    DataRectification, // Request correction of data
    DataDeletion     // Request deletion of data
}

public enum DataRightsRequestStatus
{
    Pending,
    Processed,
    Rejected
}

