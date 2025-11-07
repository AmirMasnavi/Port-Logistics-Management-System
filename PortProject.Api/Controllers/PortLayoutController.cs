// ...existing code...
using Microsoft.AspNetCore.Mvc;
using PortProject.Api.Application.PortLayout;

namespace PortProject.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PortLayoutController : ControllerBase
{
    private readonly IPortLayoutService _service;

    public PortLayoutController(IPortLayoutService service)
    {
        _service = service;
    }

    [HttpGet("{id}")]
    public IActionResult GetLayout(string id)
    {
        // The service already returns a JSON string. Return it as application/json content to avoid double-serialization.
        var json = _service.GetLayout(id);
        return Content(json, "application/json");
    }
}
// ...existing code...

