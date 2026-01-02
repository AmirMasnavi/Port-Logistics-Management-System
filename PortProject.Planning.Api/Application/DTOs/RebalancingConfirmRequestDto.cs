namespace PortProject.Planning.Api.Application.DTOs;

using System.Text.Json.Serialization;

/// <summary>
/// US 4.3.3: Request to confirm a rebalancing proposal
/// </summary>
public class RebalancingConfirmRequestDto
{
    [JsonPropertyName("proposalId")]
    public string ProposalId { get; set; } = string.Empty;

    [JsonPropertyName("officerId")]
    public string OfficerId { get; set; } = string.Empty;

    [JsonPropertyName("comments")]
    public string? Comments { get; set; }
}