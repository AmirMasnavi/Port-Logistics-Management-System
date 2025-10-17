// using Microsoft.AspNetCore.Mvc;
// using PortProject.Api.Application.VesselVisitNotification.DTOs;
// using PortProject.Api.Application.VesselVisitNotification.Services;
//
// namespace PortProject.Api.Controllers
// {
//     [Route("api/[controller]")]
//     [ApiController]
//     public class VesselVisitNotificationController : ControllerBase
//     {
//         private readonly IVesselVisitNotificationService _service;
//
//         public VesselVisitNotificationController(IVesselVisitNotificationService service)
//         {
//             _service = service;
//         }
//
//         /// <summary>
//         /// Gets all pending vessel visit notifications.
//         /// </summary>
//         [HttpGet("pending")]
//         public async Task<ActionResult<IEnumerable<VesselVisitNotificationDto>>> GetPendingNotifications()
//         {
//             try
//             {
//                 var pending = await _service.GetPendingNotificationsAsync();
//                 return Ok(pending);
//             }
//             catch (Exception ex)
//             {
//                 return StatusCode(500,
//                     new { message = "Error retrieving pending notifications.", details = ex.Message });
//             }
//         }
//
//         /// <summary>
//         /// Approves a vessel visit notification and assigns a dock.
//         /// </summary>
//         [HttpPost("{id}/approve")]
//         public async Task<IActionResult> ApproveNotification(string id, [FromBody] ApproveNotificationDto dto)
//         {
//             if (dto == null || string.IsNullOrWhiteSpace(dto.DockId) || string.IsNullOrWhiteSpace(dto.OfficerId))
//                 return BadRequest(new { message = "DockId and OfficerId are required." });
//
//             try
//             {
//                 await _service.ApproveNotificationAsync(id, dto.DockId, dto.OfficerId);
//                 return Ok(new { message = "Notification approved successfully." });
//             }
//             catch (ArgumentException ex)
//             {
//                 return BadRequest(new { message = ex.Message });
//             }
//             catch (KeyNotFoundException ex)
//             {
//                 return NotFound(new { message = ex.Message });
//             }
//             catch (InvalidOperationException ex)
//             {
//                 return Conflict(new { message = ex.Message });
//             }
//             catch (Exception ex)
//             {
//                 return StatusCode(500, new { message = "Error approving notification.", details = ex.Message });
//             }
//         }
//
//         /// <summary>
//         /// Rejects a vessel visit notification with a reason.
//         /// </summary>
//         [HttpPost("{id}/reject")]
//         public async Task<IActionResult> RejectNotification(string id, [FromBody] RejectNotificationDto dto)
//         {
//             if (dto == null || string.IsNullOrWhiteSpace(dto.Reason) || string.IsNullOrWhiteSpace(dto.OfficerId))
//                 return BadRequest(new { message = "Reason and OfficerId are required." });
//
//             try
//             {
//                 await _service.RejectNotificationAsync(id, dto.Reason, dto.OfficerId);
//                 return Ok(new { message = "Notification rejected successfully." });
//             }
//             catch (ArgumentException ex)
//             {
//                 return BadRequest(new { message = ex.Message });
//             }
//             catch (KeyNotFoundException ex)
//             {
//                 return NotFound(new { message = ex.Message });
//             }
//             catch (InvalidOperationException ex)
//             {
//                 return Conflict(new { message = ex.Message });
//             }
//             catch (Exception ex)
//             {
//                 return StatusCode(500, new { message = "Error rejecting notification.", details = ex.Message });
//             }
//         }
//
//         /// <summary>
//         /// Gets the decision log for a vessel visit notification.
//         /// </summary>
//         [HttpGet("{id}/decisions")]
//         public async Task<ActionResult<IEnumerable<DecisionLogEntryDto>>> GetDecisionLog(string id)
//         {
//             try
//             {
//                 var log = await _service.GetDecisionLogAsync(id);
//                 return Ok(log);
//             }
//             catch (KeyNotFoundException ex)
//             {
//                 return NotFound(new { message = ex.Message });
//             }
//             catch (Exception ex)
//             {
//                 return StatusCode(500, new { message = "Error