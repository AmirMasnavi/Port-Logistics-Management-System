using Microsoft.VisualStudio.TestTools.UnitTesting;
using PortProject.Api.Domain.VesselVisitNotificationAggregate;
using System;

namespace PortProject.Api.Tests.Domain.VesselVisitNotificationAggregate;

[TestClass]
public class ContainerCodeTest
{
    [TestMethod]
    public void CreateContainerCode_WithValidCode_ShouldSucceed()
    {
        // Arrange
        var code = "CSQU3054383";

        // Act
        var containerCode = new ContainerCode(code);

        // Assert
        Assert.IsNotNull(containerCode);
        Assert.AreEqual(code, containerCode.Value);
    }

    [TestMethod]
    public void ContainerCode_Equality_ShouldWorkCorrectly()
    {
        // Arrange
        var code = "HLXU8001140";
        var containerCode1 = new ContainerCode(code);
        var containerCode2 = new ContainerCode(code);

        // Act & Assert
        Assert.AreEqual(containerCode1, containerCode2);
    }

    [TestMethod]
    public void ContainerCode_DifferentCodes_ShouldNotBeEqual()
    {
        // Arrange
        var containerCode1 = new ContainerCode("CSQU3054383");
        var containerCode2 = new ContainerCode("HLXU8001140");

        // Act & Assert
        Assert.AreNotEqual(containerCode1, containerCode2);
    }
}

