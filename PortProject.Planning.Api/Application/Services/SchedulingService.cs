// File: PortProject.Planning.Api/Application/Services/SchedulingService.cs

using PortProject.Planning.Api.Application.Clients;
using PortProject.Planning.Api.Application.DTOs;
using VesselVisitDto = PortProject.Planning.Api.Application.DTOs.VesselVisitDto;

namespace PortProject.Planning.Api.Application.Services;

public class SchedulingService : ISchedulingService
{
    private readonly IPortApiHttpClient _portApiClient;

    public SchedulingService(IPortApiHttpClient portApiClient)
    {
        _portApiClient = portApiClient;
    }

    public async Task<DailyScheduleResponseDto> GenerateDailySchedule(DateOnly date)
    {
        // 1. Consumir dados do API principal (AC 2)
        var docks = (await _portApiClient.GetDocksAsync()).ToList();
        var staff = (await _portApiClient.GetAvailableStaffAsync(date)).ToList();
        var clientVisits = (await _portApiClient.GetPendingVisitsAsync(date)).ToList();

        // Map client DTOs to Planning module DTOs (client DTO lacks loading/unloading times)
        var visits = clientVisits.Select(cv => new VesselVisitDto(
            cv.Id,
            cv.Status,
            cv.EstimatedArrival,
            cv.EstimatedDeparture,
            cv.VesselImo,
            0.0, // UnloadingTime default (no data from client API)
            0.0 // LoadingTime default
        )).ToList();

        var schedule = new DailyScheduleResponseDto { Date = date };

        // Validação de recursos (AC 4c)
        if (!visits.Any())
        {
            // Poderíamos adicionar uma mensagem de aviso à resposta
            return schedule; // Sem visitas, sem agendamento
        }

        if (!docks.Any() || !staff.Any())
        {
            // Adicionar aviso sobre falta de recursos
            return schedule;
        }

        // 2. Encontrar a melhor sequência de navios (lógica traduzida do Prolog)
        var bestSchedule = FindBestSequence(visits);

        // 3. Mapear para a resposta final
        // Por simplicidade, atribuímos a sequência ao primeiro cais e ao primeiro operador disponível
        var firstDock = docks.First();
        var firstOperator = staff.FirstOrDefault(s => s.QualificationCodes.Contains("CRANE_OPERATOR")) ?? staff.First();

        foreach (var task in bestSchedule.Tasks)
        {
            schedule.ScheduledTasks.Add(new ScheduledTaskDto
            {
                VesselVisitId = task.Vessel.Id.ToString(),
                DockId = firstDock.Id,
                StaffId = firstOperator.MecanographicNumber,
                ResourceId = "CRANE-01", // Placeholder para o recurso de grua
                StartTime = task.StartTime,
                EndTime = task.EndTime
            });
        }

        return schedule;
    }

    // --- Lógica do Algoritmo (Tradução do Prolog) ---

    private record ScheduledTask(VesselVisitDto Vessel, DateTime StartTime, DateTime EndTime);

    private record ScheduleResult(List<ScheduledTask> Tasks, double TotalDelay);

    private ScheduleResult FindBestSequence(List<VesselVisitDto> visits)
    {
        ScheduleResult? bestSchedule = null;

        // `permutation(LV, SeqV)`
        foreach (var sequence in GetPermutations(visits))
        {
            // `sequence_temporization(SeqV, SeqTriplets)`
            var currentTasks = CalculateTemporization(sequence.ToList());

            // `sum_delays(SeqTriplets, S)`
            var currentDelay = CalculateTotalDelay(currentTasks);

            // `compare_shortest_delay`
            if (bestSchedule == null || currentDelay < bestSchedule.TotalDelay)
            {
                bestSchedule = new ScheduleResult(currentTasks, currentDelay);
            }
        }

        return bestSchedule ?? new ScheduleResult(new List<ScheduledTask>(), 0);
    }

    // Gera todas as permutações de uma lista (equivalente a `permutation/2`)
    private IEnumerable<IEnumerable<T>> GetPermutations<T>(IEnumerable<T> list)
    {
        var items = list.ToList();

        if (!items.Any())
        {
            yield return Enumerable.Empty<T>();
            yield break;
        }

        int i = 0;
        foreach (var item in items)
        {
            var remaining = items.Take(i).Concat(items.Skip(i + 1));
            foreach (var p in GetPermutations(remaining))
            {
                yield return p.Prepend(item);
            }

            i++;
        }
    }

    // Calcula o cronograma para uma sequência de navios (equivalente a `sequence_temporization/2`)
    private List<ScheduledTask> CalculateTemporization(List<VesselVisitDto> sequence)
    {
        var tasks = new List<ScheduledTask>();
        DateTime lastEndTime = DateTime.MinValue;

        foreach (var visit in sequence)
        {
            // O início da descarga é o máximo entre a chegada do navio e o fim da operação anterior
            var startTime = visit.EstimatedArrival > lastEndTime ? visit.EstimatedArrival : lastEndTime;

            // O tempo total da operação é a soma da descarga e da carga
            var operationDuration = visit.UnloadingTime + visit.LoadingTime;
            var endTime = startTime.AddHours(operationDuration);

            tasks.Add(new ScheduledTask(visit, startTime, endTime));
            lastEndTime = endTime;
        }

        return tasks;
    }

    // Calcula o atraso total para um cronograma (equivalente a `sum_delays/2`)
    private double CalculateTotalDelay(List<ScheduledTask> tasks)
    {
        double totalDelay = 0;
        foreach (var task in tasks)
        {
            if (task.EndTime > task.Vessel.EstimatedDeparture)
            {
                totalDelay += (task.EndTime - task.Vessel.EstimatedDeparture).TotalHours;
            }
        }

        return totalDelay;
    }
}