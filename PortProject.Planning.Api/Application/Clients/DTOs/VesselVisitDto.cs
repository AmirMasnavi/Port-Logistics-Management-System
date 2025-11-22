namespace PortProject.Planning.Api.Application.Clients.DTOs;

public record VesselVisitDto(
    Guid Id,
    string BusinessId,
    string Status, 
    DateTime EstimatedArrival, 
    DateTime EstimatedDeparture, 
    string VesselImo,
    double UnloadingTime,
    double LoadingTime
    );