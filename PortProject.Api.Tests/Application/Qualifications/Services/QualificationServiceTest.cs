using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using PortProject.Api.Application.Qualifications.DTOs;
using PortProject.Api.Application.Qualifications.Services;
using PortProject.Api.Domain.QualificationAggregate;
using PortProject.Api.Models;
using System.Threading;
using System.Threading.Tasks;

namespace PortProject.Api.Tests.Application.Qualifications.Services;

[TestClass]
public class QualificationServiceTest
{
    private readonly Mock<IQualificationRepository> _mockRepo;
    private readonly Mock<PortProjectContext> _mockContext;
    private readonly QualificationService _service;

    public QualificationServiceTest()
    {
        _mockRepo = new Mock<IQualificationRepository>();
        _mockContext = new Mock<PortProjectContext>();
        _service = new QualificationService(_mockRepo.Object, _mockContext.Object);
    }

    [TestMethod]
    public async Task CreateAsync_WithValidDto_ShouldCallRepositoryAndSaveChanges()
    {
        // Arrange
        var createDto = new CreateQualificationDto { Code = "CODE1", Name = "Name1", Description = "Desc1" };

        // Act
        var resultDto = await _service.CreateAsync(createDto);

        // Assert
        Assert.IsNotNull(resultDto);
        Assert.AreEqual(createDto.Code, resultDto.Code);

        // Verify that the repository's AddAsync method was called exactly once.
        _mockRepo.Verify(repo => repo.AddAsync(It.IsAny<Qualification>()), Times.Once);

        // Verify that SaveChangesAsync was called exactly once.
        _mockContext.Verify(ctx => ctx.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}