namespace PortProject.Planning.Api.Application.DTOs;

using System.Text.Json.Serialization;

public class DailyScheduleRequestDto
{
    [JsonPropertyName("date")]
    public string DateString { get; set; } = string.Empty;
    
    [JsonIgnore]
    public DateOnly Date => DateOnly.Parse(DateString);
    
    // Controlo de Seleção de Algoritmo (UI)
    
    /// <summary>
    /// Algorithm to use: "optimal", "heuristic", "multicrane", or "genetic"
    /// Defaults to "optimal" if not specified
    /// </summary>
    [JsonPropertyName("algorithm")]
    public string? Algorithm { get; set; } = "optimal";
    
    /// <summary>
    /// Genetic algorithm parameters (only used when Algorithm is "genetic")
    /// </summary>
    [JsonPropertyName("geneticParams")]
    public GeneticAlgorithmParamsDto? GeneticParams { get; set; }
}

public class GeneticAlgorithmParamsDto
{
    /// <summary>
    /// Population size (number of solutions per generation)
    /// </summary>
    [JsonPropertyName("populationSize")]
    public int PopulationSize { get; set; } = 50;
    
    /// <summary>
    /// Number of generations to evolve
    /// </summary>
    [JsonPropertyName("generations")]
    public int Generations { get; set; } = 100;
    
    /// <summary>
    /// Mutation rate (probability of random changes, 0.0 to 1.0)
    /// </summary>
    [JsonPropertyName("mutationRate")]
    public double MutationRate { get; set; } = 0.2;
    
    /// <summary>
    /// Desired computation time in seconds
    /// </summary>
    [JsonPropertyName("desiredTimeSeconds")]
    public int DesiredTimeSeconds { get; set; } = 5;
    
    /// <summary>
    /// Crane mode: "single" or "multiple"
    /// </summary>
    [JsonPropertyName("craneMode")]
    public string CraneMode { get; set; } = "single";
}