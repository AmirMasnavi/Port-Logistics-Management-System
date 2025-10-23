using System;
using System.Collections.Generic;
using System.Linq;
using PortProject.Api.Domain.ResourceAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.ResourceAggregate;

public class ResourceTest
{
    [Fact]
    public void WhenPassingCorrectDataToConstructor_ThenResourceIsCreated()
    {
        // Arrange
        var code = new ResourceCode("R001");
        var description = new ResourceDescription("Crane");
        var kind = ResourceKind.Crane;
        string? assignedArea = "AreaA";
        var operationalCapacity = ResourceOperationalCapacity.ForCrane(100);
        var status = ResourceStatus.Active;
        var setupTime = new ResourceSetupTime(120); // 2 hours -> minutes
        var operationalWindow = new ResourceOperationalWindow(new TimeOnly(6, 0), new TimeOnly(22, 0));
        var qualifications = new List<string> { "Certified Operator", "Safety Training" };

        // Act
        var resource = new Resource(code, description, kind, assignedArea, operationalCapacity, status, setupTime, operationalWindow, qualifications);

        // Assert
        Assert.Equal(code, resource.Code);
        Assert.Equal(description, resource.Description);
        Assert.Equal(kind, resource.Kind);
        Assert.Equal(assignedArea, resource.AssignedArea);
        Assert.Equal(operationalCapacity, resource.OperationalCapacity);
        Assert.Equal(status, resource.Status);
        Assert.Equal(setupTime, resource.SetupTime);
        Assert.Equal(operationalWindow, resource.OperationalWindow);
        Assert.Equal(qualifications.Count, resource.QualificationRequirements.Count);
    }

    [Fact]
    public void Constructor_WithNullCode_Throws()
    {
        var description = new ResourceDescription("Desc");
        var opCap = ResourceOperationalCapacity.ForCrane(10);
        var setup = new ResourceSetupTime(5);
        var window = new ResourceOperationalWindow(new TimeOnly(8, 0), new TimeOnly(16, 0));

        var ex = Assert.Throws<ArgumentNullException>(() =>
            new Resource(null, description, ResourceKind.Crane, null, opCap, ResourceStatus.Active, setup, window));
        Assert.Equal("code", ex.ParamName);
    }

    [Fact]
    public void Constructor_WithNullDescription_Throws()
    {
        var code = new ResourceCode("R01");
        var opCap = ResourceOperationalCapacity.ForCrane(10);
        var setup = new ResourceSetupTime(5);
        var window = new ResourceOperationalWindow(new TimeOnly(8, 0), new TimeOnly(16, 0));

        var ex = Assert.Throws<ArgumentNullException>(() =>
            new Resource(code, null, ResourceKind.Crane, null, opCap, ResourceStatus.Active, setup, window));
        Assert.Equal("description", ex.ParamName);
    }

    [Fact]
    public void Constructor_WithNullOperationalCapacity_Throws()
    {
        var code = new ResourceCode("R01");
        var description = new ResourceDescription("Desc");
        var setup = new ResourceSetupTime(5);
        var window = new ResourceOperationalWindow(new TimeOnly(8, 0), new TimeOnly(16, 0));

        var ex = Assert.Throws<ArgumentNullException>(() =>
            new Resource(code, description, ResourceKind.Crane, null, null, ResourceStatus.Active, setup, window));
        Assert.Equal("operationalCapacity", ex.ParamName);
    }

    [Fact]
    public void Constructor_WithNullSetupTime_Throws()
    {
        var code = new ResourceCode("R01");
        var description = new ResourceDescription("Desc");
        var opCap = ResourceOperationalCapacity.ForCrane(10);
        var window = new ResourceOperationalWindow(new TimeOnly(8, 0), new TimeOnly(16, 0));

        var ex = Assert.Throws<ArgumentNullException>(() =>
            new Resource(code, description, ResourceKind.Crane, null, opCap, ResourceStatus.Active, null, window));
        Assert.Equal("setupTime", ex.ParamName);
    }

    [Fact]
    public void Constructor_WithNullOperationalWindow_Throws()
    {
        var code = new ResourceCode("R01");
        var description = new ResourceDescription("Desc");
        var opCap = ResourceOperationalCapacity.ForCrane(10);
        var setup = new ResourceSetupTime(5);

        var ex = Assert.Throws<ArgumentNullException>(() =>
            new Resource(code, description, ResourceKind.Crane, null, opCap, ResourceStatus.Active, setup, null));
        Assert.Equal("operationalWindow", ex.ParamName);
    }

    [Fact]
    public void UpdateDescription_UpdatesValue()
    {
        var resource = BuildDefaultResource();
        var newDesc = new ResourceDescription("New Desc");

        resource.UpdateDescription(newDesc);

        Assert.Equal(newDesc, resource.Description);
    }

    [Fact]
    public void UpdateDescription_WithNull_Throws()
    {
        var resource = BuildDefaultResource();
        var ex = Assert.Throws<ArgumentNullException>(() => resource.UpdateDescription(null));
        Assert.Equal("newDescription", ex.ParamName);
    }

    [Fact]
    public void UpdateOperationalCapacity_UpdatesValue()
    {
        var resource = BuildDefaultResource();
        var newCap = ResourceOperationalCapacity.ForTruck(2, 40);

        resource.UpdateOperationalCapacity(newCap);

        Assert.Equal(newCap, resource.OperationalCapacity);
        Assert.Equal(ResourceKind.Truck, resource.OperationalCapacity.Kind);
    }

    [Fact]
    public void UpdateOperationalCapacity_WithNull_Throws()
    {
        var resource = BuildDefaultResource();
        var ex = Assert.Throws<ArgumentNullException>(() => resource.UpdateOperationalCapacity(null));
        Assert.Equal("newOperationalCapacity", ex.ParamName);
    }

    [Fact]
    public void AssignArea_SetsArea()
    {
        var resource = BuildDefaultResource();
        resource.AssignArea("Zone-1");
        Assert.Equal("Zone-1", resource.AssignedArea);
    }

    [Fact]
    public void SetQualifications_FiltersAndReplaces()
    {
        var resource = BuildDefaultResource();

        resource.SetQualifications(new[] { "A", " ", null, "B" });

        Assert.Equal(2, resource.QualificationRequirements.Count);
        Assert.Contains("A", resource.QualificationRequirements);
        Assert.Contains("B", resource.QualificationRequirements);

        // Replace with another set
        resource.SetQualifications(new[] { "C" });
        Assert.Single(resource.QualificationRequirements);
        Assert.Contains("C", resource.QualificationRequirements);
    }

    [Fact]
    public void StatusTransitions_Work()
    {
        var resource = BuildDefaultResource();

        resource.Deactivate();
        Assert.Equal(ResourceStatus.Inactive, resource.Status);

        resource.SetUnderMaintenance();
        Assert.Equal(ResourceStatus.UnderMaintenance, resource.Status);

        resource.Activate();
        Assert.Equal(ResourceStatus.Active, resource.Status);
    }

    [Fact]
    public void ToString_FormatsExpected()
    {
        var code = new ResourceCode("R002");
        var description = new ResourceDescription("Truck");
        var kind = ResourceKind.Truck;
        string? area = "Yard-5";
        var opCap = ResourceOperationalCapacity.ForTruck(3, 50);
        var status = ResourceStatus.Inactive;
        var setup = new ResourceSetupTime(15);
        var window = new ResourceOperationalWindow(new TimeOnly(7, 30), new TimeOnly(19, 0));

        var resource = new Resource(code, description, kind, area, opCap, status, setup, window);

        var expected = $"Code: {code}, Description: {description}, Kind: {kind}, Area: {area}, OperationalCapacity: {opCap}, Status: {status}, SetupTime: {setup}, OperationalWindow: {window}";

        Assert.Equal(expected, resource.ToString());
    }

    private static Resource BuildDefaultResource()
    {
        var code = new ResourceCode("R000");
        var description = new ResourceDescription("Default");
        var opCap = ResourceOperationalCapacity.ForCrane(10);
        var setup = new ResourceSetupTime(5);
        var window = new ResourceOperationalWindow(new TimeOnly(8, 0), new TimeOnly(16, 0));
        return new Resource(code, description, ResourceKind.Crane, null, opCap, ResourceStatus.Active, setup, window);
    }
}