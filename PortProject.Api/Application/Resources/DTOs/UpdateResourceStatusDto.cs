using PortProject.Api.Domain.ResourceAggregate;

namespace PortProject.Api.Application.Resources.DTOs;

public class UpdateResourceStatusDto
{
    public ResourceStatus NewStatus { get; set; }
}