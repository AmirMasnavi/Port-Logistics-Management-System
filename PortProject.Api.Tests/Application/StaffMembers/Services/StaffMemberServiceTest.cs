using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using PortProject.Api.Application.StaffMembers.DTOs;
using PortProject.Api.Application.StaffMembers.Services;
using PortProject.Api.Domain.StaffMemberAggregate;
using PortProject.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PortProject.Api.Tests.Application.StaffMembers.Services;

[TestClass]
public class StaffMemberServiceTest
{
    private Mock<IStaffMemberRepository> _mockRepo;
    private Mock<PortProjectContext> _mockContext;
    private StaffMemberService _service;

    [TestInitialize]
    public void Setup()
    {
        // Mock dependencies
        _mockRepo = new Mock<IStaffMemberRepository>();
        _mockContext = new Mock<PortProjectContext>();

        // Setup mock for SaveChangesAsync to return a completed task
        _mockContext.Setup(c => c.SaveChangesAsync(default)).ReturnsAsync(1);

        _service = new StaffMemberService(_mockRepo.Object, _mockContext.Object);
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
        var exception = await Assert.ThrowsExceptionAsync<ArgumentException>(() => 
            _service.CreateStaffMemberAsync(createDto)
        );
        Assert.IsNotNull(exception);
    }

    [TestMethod]
    public async Task GetAllAsync_WithoutFilters_ShouldReturnAllStaffMembers()
    {
        // Arrange: Create sample staff members
        var staffMembers = new List<StaffMember>
        {
            CreateSampleStaffMember("EMP001", "John Doe", StaffStatus.Available),
            CreateSampleStaffMember("EMP002", "Jane Smith", StaffStatus.Unavailable)
        };

        _mockRepo
            .Setup(repo => repo.GetAllAsync(null, null, null))
            .ReturnsAsync(staffMembers);

        // Act
        var result = await _service.GetAllAsync(null, null, null);
        var resultList = result.ToList();

        // Assert
        Assert.IsNotNull(resultList);
        Assert.AreEqual(2, resultList.Count);
        _mockRepo.Verify(repo => repo.GetAllAsync(null, null, null), Times.Once);
    }

    [TestMethod]
    public async Task GetAllAsync_WithNameFilter_ShouldReturnFilteredStaffMembers()
    {
        // Arrange
        var staffMembers = new List<StaffMember>
        {
            CreateSampleStaffMember("EMP001", "John Doe", StaffStatus.Available)
        };

        _mockRepo
            .Setup(repo => repo.GetAllAsync("John", null, null))
            .ReturnsAsync(staffMembers);

        // Act
        var result = await _service.GetAllAsync("John", null, null);
        var resultList = result.ToList();

        // Assert
        Assert.IsNotNull(resultList);
        Assert.AreEqual(1, resultList.Count);
        Assert.AreEqual("John Doe", resultList.First().ShortName);
        _mockRepo.Verify(repo => repo.GetAllAsync("John", null, null), Times.Once);
    }

    [TestMethod]
    public async Task GetAllAsync_WithStatusFilter_ShouldReturnFilteredStaffMembers()
    {
        // Arrange
        var staffMembers = new List<StaffMember>
        {
            CreateSampleStaffMember("EMP001", "John Doe", StaffStatus.Available)
        };

        _mockRepo
            .Setup(repo => repo.GetAllAsync(null, StaffStatus.Available, null))
            .ReturnsAsync(staffMembers);

        // Act
        var result = await _service.GetAllAsync(null, StaffStatus.Available, null);
        var resultList = result.ToList();

        // Assert
        Assert.IsNotNull(resultList);
        Assert.AreEqual(1, resultList.Count);
        Assert.AreEqual(StaffStatus.Available.ToString(), resultList.First().CurrentStatus);
        _mockRepo.Verify(repo => repo.GetAllAsync(null, StaffStatus.Available, null), Times.Once);
    }

    [TestMethod]
    public async Task GetAllAsync_WithQualificationFilter_ShouldReturnFilteredStaffMembers()
    {
        // Arrange
        var qualificationCode = "CRANE-OP";
        var staffMembers = new List<StaffMember>
        {
            CreateSampleStaffMember("EMP001", "John Doe", StaffStatus.Available)
        };

        _mockRepo
            .Setup(repo => repo.GetAllAsync(null, null, qualificationCode))
            .ReturnsAsync(staffMembers);

        // Act
        var result = await _service.GetAllAsync(null, null, qualificationCode);
        var resultList = result.ToList();

        // Assert
        Assert.IsNotNull(resultList);
        Assert.AreEqual(1, resultList.Count);
        _mockRepo.Verify(repo => repo.GetAllAsync(null, null, qualificationCode), Times.Once);
    }

    [TestMethod]
    public async Task GetAllAsync_WithAllFilters_ShouldReturnFilteredStaffMembers()
    {
        // Arrange
        var nameFilter = "John";
        var statusFilter = StaffStatus.Available;
        var qualificationCode = "CRANE-OP";
        
        var staffMembers = new List<StaffMember>
        {
            CreateSampleStaffMember("EMP001", "John Doe", StaffStatus.Available)
        };

        _mockRepo
            .Setup(repo => repo.GetAllAsync(nameFilter, statusFilter, qualificationCode))
            .ReturnsAsync(staffMembers);

        // Act
        var result = await _service.GetAllAsync(nameFilter, statusFilter, qualificationCode);
        var resultList = result.ToList();

        // Assert
        Assert.IsNotNull(resultList);
        Assert.AreEqual(1, resultList.Count);
        Assert.AreEqual("John Doe", resultList.First().ShortName);
        Assert.AreEqual(StaffStatus.Available.ToString(), resultList.First().CurrentStatus);
        _mockRepo.Verify(repo => repo.GetAllAsync(nameFilter, statusFilter, qualificationCode), Times.Once);
    }

    // Helper method to create sample staff members for testing
    private StaffMember CreateSampleStaffMember(string mecNumber, string name, StaffStatus status)
    {
        var mecanographicNumber = new MecanographicNumber(mecNumber);
        var contactDetails = new ContactDetails("test@example.com", "912345678");
        var operationalWindow = new OperationalWindow(new TimeOnly(9, 0), new TimeOnly(17, 0));
        
        var staffMember = new StaffMember(mecanographicNumber, name, contactDetails, operationalWindow);
        
        // Set status if needed (using reflection or a method if available)
        if (status != StaffStatus.Available)
        {
            staffMember.UpdateStatus(status);
        }
        
        return staffMember;
    }
}
