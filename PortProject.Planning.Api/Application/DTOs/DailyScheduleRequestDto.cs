namespace PortProject.Planning.Api.Application.DTOs;

public class DailyScheduleRequestDto
{
    public DateOnly Date { get; set; }
    
    // Controlo de Seleção de Algoritmo (UI)
    
    /// <summary>
    /// Algorithm to use: "optimal", "heuristic", or "multicrane"
    /// Defaults to "optimal" if not specified
    /// </summary>
    public string? Algorithm { get; set; } = "optimal";
}