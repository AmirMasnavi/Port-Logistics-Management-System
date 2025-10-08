using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using PortProject.Api.Application.StaffMembers.Services;
using PortProject.Api.Application.StaffMembers.DTOs;
using PortProject.Api.Controllers;
using System;
using System.Threading.Tasks;

namespace PortProject.Api.Tests.Controllers;

[TestClass]
public class StaffMembersControllerTest
{
    private readonly Mock<IStaffMemberService> _mockService;
    private readonly StaffMembersController _controller;

    public StaffMembersControllerTest()
    {
        _mockService = new Mock<IStaffMemberService>();
        _controller = new StaffMembersController(_mockService.Object);
    }

    [TestMethod]
    public async Task CreateStaffMember_WithValidDto_ShouldReturnCreatedAtAction()
    {
        // Arrange: Set up the DTOs and configure the mock service.
        var createDto = new CreateStaffMemberDto { MecanographicNumber = "EMP123" };
        var expectedResultDto = new StaffMemberDto { MecanographicNumber = "EMP123" };

        // Tell the mock service to return our expected DTO when called.
        _mockService
            .Setup(service => service.CreateStaffMemberAsync(createDto))
            .ReturnsAsync(expectedResultDto);

        // Act: Call the controller action.
        var result = await _controller.CreateStaffMember(createDto);

        // Assert: Check that the result is a 201 Created response.
        Assert.IsInstanceOfType(result.Result, typeof(CreatedAtActionResult));
        var createdResult = (CreatedAtActionResult)result.Result;
        Assert.AreEqual(201, createdResult.StatusCode);
        Assert.IsNotNull(createdResult.Value);
        var returnedDto = createdResult.Value as StaffMemberDto;
        Assert.IsNotNull(returnedDto);
        Assert.AreEqual(expectedResultDto.MecanographicNumber, returnedDto.MecanographicNumber);
    }

    [TestMethod]
    public async Task CreateStaffMember_WhenServiceThrowsException_ShouldReturnBadRequest()
    {
        // Arrange: Set up the mock service to throw an exception.
        var createDto = new CreateStaffMemberDto();
        var exceptionMessage = "Invalid mecanographic number";

        _mockService
            .Setup(service => service.CreateStaffMemberAsync(createDto))
            .ThrowsAsync(new ArgumentException(exceptionMessage));

        // Act: Call the controller action.
        var result = await _controller.CreateStaffMember(createDto);

        // Assert: Check that the result is a 400 Bad Request response.
        Assert.IsInstanceOfType(result.Result, typeof(BadRequestObjectResult));
        var badRequestResult = (BadRequestObjectResult)result.Result;
        Assert.AreEqual(400, badRequestResult.StatusCode);
    }
}