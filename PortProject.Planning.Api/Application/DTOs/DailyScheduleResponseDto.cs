namespace PortProject.Planning.Api.Application.DTOs;

public class DailyScheduleResponseDto
{
    public DateOnly Date { get; set; }
    public List<ScheduledTaskDto> ScheduledTasks { get; set; } = new();

    // Visualização Comparativa (Métricas)
    // A UI deve exibir este valor em destaque para mostrar a "qualidade" da solução.
    
    public double TotalDelay { get; set; }
    public List<string> Warnings { get; set; } = new();
    
    // Visualização Comparativa (Performance)
    // A UI deve exibir este valor para justificar o uso da Heurística.

    // Execution time in milliseconds for generating the schedule
    public double ExecutionTimeMs { get; set; }
    
    // Algorithm that was actually used (useful when "automatic" selection is chosen)
    public string? AlgorithmUsed { get; set; }
}
