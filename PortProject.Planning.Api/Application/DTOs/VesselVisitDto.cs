namespace PortProject.Planning.Api.Application.DTOs;

public record VesselVisitDto(
    Guid Id, 
    string Status, 
    DateTime EstimatedArrival, 
    DateTime EstimatedDeparture, 
    string VesselImo,
    double UnloadingTime,
    double LoadingTime
);