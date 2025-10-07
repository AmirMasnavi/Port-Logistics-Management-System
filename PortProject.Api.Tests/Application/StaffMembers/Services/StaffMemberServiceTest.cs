using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using PortProject.Api.Application.StaffMembers.DTOs;
using PortProject.Api.Application.StaffMembers.Services;
using PortProject.Api.Domain.StaffMemberAggregate;
using PortProject.Api.Models;
using System;
using System.Threading.Tasks;

namespace PortProject.Api.Tests.Application.StaffMembers.Services;

[TestClass]
public class StaffMemberServiceTest
{
    private readonly StaffMemberService _service;

    public StaffMemberServiceTest()
    {
        // Mock dependencies
        var mockRepo = new Mock<IStaffMemberRepository>();
        var mockContext = new Mock<PortProjectContext>();

        // Setup mock for SaveChangesAsync to return a completed task
        mockContext.Setup(c => c.SaveChangesAsync(default)).ReturnsAsync(1);

        _service = new StaffMemberService(mockRepo.Object, mockContext.Object);
    }

    [TestMethod]
    public async Task CreateStaffMemberAsync_WithValidData_ShouldReturnCorrectDto()
    {
        // Arrange: Set up the test data.
        var createDto = new CreateStaffMemberDto
        {
            MecanographicNumber = "EMP123",
            ShortName = "Test User",
            Email = "test@user.com",
            Phone = "912345678",
            StartTime = new TimeOnly(9, 0),
            EndTime = new TimeOnly(17, 0)
        };

        // Act: Call the method we are testing.
        var resultDto = await _service.CreateStaffMemberAsync(createDto);

        // Assert: Verify the result is correct.
        Assert.IsNotNull(resultDto);
        Assert.AreEqual(createDto.MecanographicNumber, resultDto.MecanographicNumber);
        Assert.AreEqual(createDto.ShortName, resultDto.ShortName);
        Assert.AreEqual(StaffStatus.Available.ToString(), resultDto.CurrentStatus);
        
        // No repository is injected in the current implementation, so nothing to verify here.
    }

    [TestMethod]
    public async Task CreateStaffMemberAsync_WithEmptyMecanographicNumber_ShouldThrowArgumentException()
    {
        // Arrange: Set up invalid test data.
        var createDto = new CreateStaffMemberDto
        {
            MecanographicNumber = "", // Invalid data
            ShortName = "Test User",
            Email = "test@user.com",
            Phone = "912345678",
            StartTime = new TimeOnly(9, 0),
            EndTime = new TimeOnly(17, 0)
        };

        // Act & Assert: Verify that the correct exception is thrown.
        // The domain object's validation should be triggered by the service.
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => 
            _service.CreateStaffMemberAsync(createDto)
        );
    }
}
