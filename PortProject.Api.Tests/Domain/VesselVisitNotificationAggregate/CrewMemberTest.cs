using Microsoft.VisualStudio.TestTools.UnitTesting;
using PortProject.Api.Domain.VesselVisitNotificationAggregate;
using System;

namespace PortProject.Api.Tests.Domain.VesselVisitNotificationAggregate;

[TestClass]
public class CrewMemberTest
{
    [TestMethod]
    public void CreateCrewMember_WithValidParameters_ShouldSucceed()
    {
        // Arrange
        var name = "John Smith";
        var nationality = "USA";
        var isSafetyOfficer = false;

        // Act
        var crewMember = new CrewMember(name, nationality, isSafetyOfficer);

        // Assert
        Assert.IsNotNull(crewMember);
        Assert.IsNotNull(crewMember.Id);
        Assert.AreEqual(name, crewMember.Name);
        Assert.AreEqual(nationality, crewMember.Nationality);
        Assert.AreEqual(isSafetyOfficer, crewMember.IsSafetyOfficer);
    }

    [TestMethod]
    public void CreateCrewMember_AsSafetyOfficer_ShouldSucceed()
    {
        // Arrange
        var name = "Jane Doe";
        var nationality = "UK";
        var isSafetyOfficer = true;

        // Act
        var crewMember = new CrewMember(name, nationality, isSafetyOfficer);

        // Assert
        Assert.IsNotNull(crewMember);
        Assert.IsTrue(crewMember.IsSafetyOfficer);
    }

    [TestMethod]
    public void CreateCrewMember_GeneratesUniqueId()
    {
        // Arrange & Act
        var crewMember1 = new CrewMember("John", "USA", false);
        var crewMember2 = new CrewMember("Jane", "UK", true);

        // Assert
        Assert.AreNotEqual(crewMember1.Id, crewMember2.Id);
    }
}

