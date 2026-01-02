namespace PortProject.Planning.Api.Application.DTOs;

using System.Text.Json.Serialization;

/// <summary>
/// US 4.3.3: Rebalancing proposal comparing baseline vs proposed allocation
/// </summary>
public class RebalancingProposalDto
{
    [JsonPropertyName("proposalId")]
    public string ProposalId { get; set; } = string.Empty;

    [JsonPropertyName("date")]
    public string Date { get; set; } = string.Empty;

    [JsonPropertyName("totalDelayBaseline")]
    public double TotalDelayBaseline { get; set; }

    [JsonPropertyName("totalDelayProposed")]
    public double TotalDelayProposed { get; set; }

    [JsonPropertyName("improvementMinutes")]
    public double? ImprovementMinutes { get; set; }

    [JsonPropertyName("baselineTasks")]
    public List<ScheduledTaskDto> BaselineTasks { get; set; } = new();

    [JsonPropertyName("proposedTasks")]
    public List<ScheduledTaskDto> ProposedTasks { get; set; } = new();

    [JsonPropertyName("warnings")]
    public List<string> Warnings { get; set; } = new();
}