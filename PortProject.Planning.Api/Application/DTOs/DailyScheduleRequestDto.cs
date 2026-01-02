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
    /// Algorithm to use: "optimal", "heuristic", "multicrane", "genetic", or "rebalancing"
    /// Defaults to "optimal" if not specified
    /// </summary>
    [JsonPropertyName("algorithm")]
    public string? Algorithm { get; set; } = "optimal";
    
    /// <summary>
    /// Genetic algorithm parameters (only used when Algorithm is "genetic")
    /// </summary>
    [JsonPropertyName("geneticParams")]
    public GeneticAlgorithmParamsDto? GeneticParams { get; set; }
    
    /// <summary>
    /// Rebalancing algorithm parameters (only used when Algorithm is "rebalancing")
    /// </summary>
    [JsonPropertyName("rebalancingParams")]
    public RebalancingAlgorithmParamsDto? RebalancingParams { get; set; }
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

/// <summary>
/// US 4.3.3: Parameters for rebalancing algorithm
/// </summary>
public class RebalancingAlgorithmParamsDto
{
    /// <summary>
    /// Weight for expected departure delays in the objective function
    /// </summary>
    [JsonPropertyName("expectedDepartureDelaysWeight")]
    public double ExpectedDepartureDelaysWeight { get; set; } = 1.0;
    
    /// <summary>
    /// Weight for dock capacity and congestion in the objective function
    /// </summary>
    [JsonPropertyName("dockCapacityAndCongestionWeight")]
    public double DockCapacityAndCongestionWeight { get; set; } = 0.6;
    
    /// <summary>
    /// Weight for crane availability in the objective function
    /// </summary>
    [JsonPropertyName("craneAvailabilityWeight")]
    public double CraneAvailabilityWeight { get; set; } = 0.8;
    
    /// <summary>
    /// Maximum number of iterations for the rebalancing algorithm
    /// </summary>
    [JsonPropertyName("maxIterations")]
    public int MaxIterations { get; set; } = 300;
    
    /// <summary>
    /// Desired computation time in seconds for the rebalancing algorithm
    /// </summary>
    [JsonPropertyName("desiredTimeSeconds")]
    public int DesiredTimeSeconds { get; set; } = 15;
    
    /// <summary>
    /// Enforce vessel and dock constraints during rebalancing
    /// </summary>
    [JsonPropertyName("enforceVesselAndDockConstraints")]
    public bool EnforceVesselAndDockConstraints { get; set; } = true;
    
    /// <summary>
    /// Variant of the rebalancing algorithm to use (e.g., "simulatedAnnealing")
    /// </summary>
    [JsonPropertyName("variant")]
    public string Variant { get; set; } = "simulatedAnnealing";
}

