namespace PortProject.Planning.Api.Application.DTOs;

public class DailyScheduleResponseDto
{
    public DateOnly Date { get; set; }
    public List<ScheduledTaskDto> ScheduledTasks { get; set; } = new();

    public double TotalDelay { get; set; }
    public List<string> Warnings { get; set; } = new();

    // Execution time in milliseconds for generating the schedule
    public double ExecutionTimeMs { get; set; }
}
