using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using PortProject.Api.Application.StaffMembers.Services;
using PortProject.Api.Application.StaffMembers.DTOs;
using PortProject.Api.Controllers;
using PortProject.Api.Domain.StaffMemberAggregate;
using System;
using System.Collections.Generic;
using System.Linq;
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

    [TestMethod]
    public async Task GetAllStaffMembers_WithoutFilters_ShouldReturnAllStaffMembers()
    {
        // Arrange
        var expectedStaffMembers = new List<StaffMemberDto>
        {
            new StaffMemberDto { MecanographicNumber = "EMP001", ShortName = "John Doe" },
            new StaffMemberDto { MecanographicNumber = "EMP002", ShortName = "Jane Smith" }
        };

        _mockService
            .Setup(service => service.GetAllAsync(null, null, null))
            .ReturnsAsync(expectedStaffMembers);

        // Act
        var result = await _controller.GetAllStaffMembers(null, null, null);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
        var okResult = (OkObjectResult)result.Result;
        var returnedStaff = okResult.Value as IEnumerable<StaffMemberDto>;
        Assert.IsNotNull(returnedStaff);
        Assert.AreEqual(2, returnedStaff.Count());
    }

    [TestMethod]
    public async Task GetAllStaffMembers_WithNameFilter_ShouldReturnFilteredStaffMembers()
    {
        // Arrange
        var nameFilter = "John";
        var expectedStaffMembers = new List<StaffMemberDto>
        {
            new StaffMemberDto { MecanographicNumber = "EMP001", ShortName = "John Doe" }
        };

        _mockService
            .Setup(service => service.GetAllAsync(nameFilter, null, null))
            .ReturnsAsync(expectedStaffMembers);

        // Act
        var result = await _controller.GetAllStaffMembers(nameFilter, null, null);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
        var okResult = (OkObjectResult)result.Result;
        var returnedStaff = okResult.Value as IEnumerable<StaffMemberDto>;
        Assert.IsNotNull(returnedStaff);
        Assert.AreEqual(1, returnedStaff.Count());
        Assert.AreEqual("John Doe", returnedStaff.First().ShortName);
        _mockService.Verify(service => service.GetAllAsync(nameFilter, null, null), Times.Once);
    }

    [TestMethod]
    public async Task GetAllStaffMembers_WithStatusFilter_ShouldReturnFilteredStaffMembers()
    {
        // Arrange
        var statusFilter = StaffStatus.Available;
        var expectedStaffMembers = new List<StaffMemberDto>
        {
            new StaffMemberDto 
            { 
                MecanographicNumber = "EMP001", 
                ShortName = "John Doe",
                CurrentStatus = StaffStatus.Available.ToString()
            }
        };

        _mockService
            .Setup(service => service.GetAllAsync(null, statusFilter, null))
            .ReturnsAsync(expectedStaffMembers);

        // Act
        var result = await _controller.GetAllStaffMembers(null, statusFilter, null);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
        var okResult = (OkObjectResult)result.Result;
        var returnedStaff = okResult.Value as IEnumerable<StaffMemberDto>;
        Assert.IsNotNull(returnedStaff);
        Assert.AreEqual(1, returnedStaff.Count());
        Assert.AreEqual(StaffStatus.Available.ToString(), returnedStaff.First().CurrentStatus);
        _mockService.Verify(service => service.GetAllAsync(null, statusFilter, null), Times.Once);
    }

    [TestMethod]
    public async Task GetAllStaffMembers_WithQualificationFilter_ShouldReturnFilteredStaffMembers()
    {
        // Arrange
        var qualificationCode = "CRANE-OP";
        var expectedStaffMembers = new List<StaffMemberDto>
        {
            new StaffMemberDto { MecanographicNumber = "EMP001", ShortName = "John Doe" }
        };

        _mockService
            .Setup(service => service.GetAllAsync(null, null, qualificationCode))
            .ReturnsAsync(expectedStaffMembers);

        // Act
        var result = await _controller.GetAllStaffMembers(null, null, qualificationCode);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
        var okResult = (OkObjectResult)result.Result;
        var returnedStaff = okResult.Value as IEnumerable<StaffMemberDto>;
        Assert.IsNotNull(returnedStaff);
        Assert.AreEqual(1, returnedStaff.Count());
        _mockService.Verify(service => service.GetAllAsync(null, null, qualificationCode), Times.Once);
    }

    [TestMethod]
    public async Task GetAllStaffMembers_WithAllFilters_ShouldReturnFilteredStaffMembers()
    {
        // Arrange
        var nameFilter = "John";
        var statusFilter = StaffStatus.Available;
        var qualificationCode = "CRANE-OP";
        var expectedStaffMembers = new List<StaffMemberDto>
        {
            new StaffMemberDto 
            { 
                MecanographicNumber = "EMP001", 
                ShortName = "John Doe",
                CurrentStatus = StaffStatus.Available.ToString()
            }
        };

        _mockService
            .Setup(service => service.GetAllAsync(nameFilter, statusFilter, qualificationCode))
            .ReturnsAsync(expectedStaffMembers);

        // Act
        var result = await _controller.GetAllStaffMembers(nameFilter, statusFilter, qualificationCode);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
        var okResult = (OkObjectResult)result.Result;
        var returnedStaff = okResult.Value as IEnumerable<StaffMemberDto>;
        Assert.IsNotNull(returnedStaff);
        Assert.AreEqual(1, returnedStaff.Count());
        Assert.AreEqual("John Doe", returnedStaff.First().ShortName);
        Assert.AreEqual(StaffStatus.Available.ToString(), returnedStaff.First().CurrentStatus);
        _mockService.Verify(service => service.GetAllAsync(nameFilter, statusFilter, qualificationCode), Times.Once);
    }

    [TestMethod]
    public async Task GetAllStaffMembers_WithNoResults_ShouldReturnEmptyList()
    {
        // Arrange
        var emptyList = new List<StaffMemberDto>();
        
        _mockService
            .Setup(service => service.GetAllAsync(null, null, null))
            .ReturnsAsync(emptyList);

        // Act
        var result = await _controller.GetAllStaffMembers(null, null, null);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
        var okResult = (OkObjectResult)result.Result;
        var returnedStaff = okResult.Value as IEnumerable<StaffMemberDto>;
        Assert.IsNotNull(returnedStaff);
        Assert.AreEqual(0, returnedStaff.Count());
    }
}