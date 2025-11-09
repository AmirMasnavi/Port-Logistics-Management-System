namespace PortProject.Planning.Api.Application.DTOs;

public class DailyScheduleResponseDto
{
    public DateOnly Date { get; set; }
    public List<ScheduledTaskDto> ScheduledTasks { get; set; } = new();
}

