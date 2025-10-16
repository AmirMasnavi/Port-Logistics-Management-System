using System;
using Xunit;
using PortProject.Api.Domain.VesselAggregate;
using src.Domain.VesselTypeAggregate;

namespace PortProject.Api.Tests.Domain.VesselAggregate;

public class VesselTest
{
    [Fact]
    public void WhenPassingCorrectDataToConstructor_ThenVesselIsInstantiated()
    {
        // Arrange
        var imo = new ImoNumber("1234567"); // valid per check-digit rule
        var name = "Evergreen";
        var typeId = new VesselTypeId(Guid.NewGuid().ToString());
        var op = new VesselOperator("Maersk");

        // Act
        var vessel = new Vessel(imo, name, typeId, op);

        // Assert
        Assert.NotNull(vessel);
        Assert.Equal(imo, vessel.ImoNumber);
        Assert.Equal(name, vessel.Name);
        Assert.Equal(typeId, vessel.VesselTypeId);
        Assert.Equal(op, vessel.Operator);
        Assert.True((DateTime.UtcNow - vessel.CreatedAt).TotalSeconds < 5);
        Assert.True((DateTime.UtcNow - vessel.UpdatedAt).TotalSeconds < 5);
        Assert.True(vessel.CreatedAt <= vessel.UpdatedAt);
    }

    [Fact]
    public void WhenPassingNullImoToConstructor_ThenThrowsArgumentNullException()
    {
        // Arrange
        ImoNumber imo = null;
        var typeId = new VesselTypeId(Guid.NewGuid().ToString());
        var op = new VesselOperator("MSC");

        // Assert
        var ex = Assert.Throws<ArgumentNullException>(() => new Vessel(imo, "Name", typeId, op));
        Assert.Equal("imoNumber", ex.ParamName);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void WhenPassingInvalidNameToConstructor_ThenThrowsArgumentException(string badName)
    {
        // Arrange
        var imo = new ImoNumber("1234567");
        var typeId = new VesselTypeId(Guid.NewGuid().ToString());
        var op = new VesselOperator("MSC");

        // Assert
        var ex = Assert.Throws<ArgumentException>(() => new Vessel(imo, badName, typeId, op));
        Assert.Equal("name", ex.ParamName);
    }

    [Fact]
    public void WhenPassingNullVesselTypeIdToConstructor_ThenThrowsArgumentNullException()
    {
        // Arrange
        var imo = new ImoNumber("1234567");
        VesselTypeId typeId = null;
        var op = new VesselOperator("MSC");

        // Assert
        var ex = Assert.Throws<ArgumentNullException>(() => new Vessel(imo, "Name", typeId, op));
        Assert.Equal("vesselTypeId", ex.ParamName);
    }

    [Fact]
    public void WhenPassingNullOperatorToConstructor_ThenThrowsArgumentNullException()
    {
        // Arrange
        var imo = new ImoNumber("1234567");
        var typeId = new VesselTypeId(Guid.NewGuid().ToString());
        VesselOperator op = null;

        // Assert
        var ex = Assert.Throws<ArgumentNullException>(() => new Vessel(imo, "Name", typeId, op));
        Assert.Equal("vesselOperator", ex.ParamName);
    }

    [Fact]
    public void FactoryCreate_WithValidData_ReturnsVessel()
    {
        // Arrange
        var imo = "1234567"; // valid
        var name = "CMA CGM";
        var typeId = Guid.NewGuid().ToString();
        var operatorName = "CMA";

        // Act
        var vessel = Vessel.Create(imo, name, typeId, operatorName);

        // Assert
        Assert.NotNull(vessel);
        Assert.Equal(imo, vessel.ImoNumber.Value);
        Assert.Equal(name, vessel.Name);
        Assert.Equal(typeId, vessel.VesselTypeId.Value);
        Assert.Equal(operatorName, vessel.Operator.Value);
    }

    [Theory]
    [InlineData("", "Name", "TYPE", "Op")] // empty IMO
    [InlineData("abcdefg", "Name", "TYPE", "Op")] // non-numeric IMO
    [InlineData("1234560", "Name", "TYPE", "Op")] // wrong check digit
    [InlineData("1234567", "", "TYPE", "Op")] // empty name
    [InlineData("1234567", "Name", "", "Op")] // empty VesselTypeId
    [InlineData("1234567", "Name", "TYPE", "")] // empty operator
    public void FactoryCreate_WithInvalidData_Throws(string imo, string name, string typeId, string operatorName)
    {
        // Assert
        Assert.ThrowsAny<ArgumentException>(() => Vessel.Create(imo, name, typeId, operatorName));
    }

    [Fact]
    public void UpdateName_WithValidValue_UpdatesAndSetsUpdatedAt()
    {
        // Arrange
        var vessel = Vessel.Create("1234567", "OldName", Guid.NewGuid().ToString(), "Op");
        var before = vessel.UpdatedAt;

        // Act
        vessel.UpdateName("NewName");

        // Assert
        Assert.Equal("NewName", vessel.Name);
        Assert.True(vessel.UpdatedAt >= before);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void UpdateName_WithInvalidValue_Throws(string newName)
    {
        // Arrange
        var vessel = Vessel.Create("1234567", "Name", Guid.NewGuid().ToString(), "Op");

        // Assert
        var ex = Assert.Throws<ArgumentException>(() => vessel.UpdateName(newName));
        Assert.Equal("newName", ex.ParamName);
    }

    [Fact]
    public void UpdateVesselType_WithValidValue_UpdatesAndSetsUpdatedAt()
    {
        // Arrange
        var vessel = Vessel.Create("1234567", "Name", Guid.NewGuid().ToString(), "Op");
        var before = vessel.UpdatedAt;
        var newType = new VesselTypeId(Guid.NewGuid().ToString());

        // Act
        vessel.UpdateVesselType(newType);

        // Assert
        Assert.Equal(newType, vessel.VesselTypeId);
        Assert.True(vessel.UpdatedAt >= before);
    }

    [Fact]
    public void UpdateVesselType_WithNull_Throws()
    {
        // Arrange
        var vessel = Vessel.Create("1234567", "Name", Guid.NewGuid().ToString(), "Op");

        // Assert
        var ex = Assert.Throws<ArgumentNullException>(() => vessel.UpdateVesselType(null));
        Assert.Equal("newType", ex.ParamName);
    }

    [Fact]
    public void UpdateOperator_WithValidValue_UpdatesAndSetsUpdatedAt()
    {
        // Arrange
        var vessel = Vessel.Create("1234567", "Name", Guid.NewGuid().ToString(), "OldOp");
        var before = vessel.UpdatedAt;
        var newOp = new VesselOperator("NewOp");

        // Act
        vessel.UpdateOperator(newOp);

        // Assert
        Assert.Equal(newOp, vessel.Operator);
        Assert.True(vessel.UpdatedAt >= before);
    }

    [Fact]
    public void UpdateOperator_WithNull_Throws()
    {
        // Arrange
        var vessel = Vessel.Create("1234567", "Name", Guid.NewGuid().ToString(), "Op");

        // Assert
        var ex = Assert.Throws<ArgumentNullException>(() => vessel.UpdateOperator(null));
        Assert.Equal("newOperator", ex.ParamName);
    }

    [Fact]
    public void ToString_ReturnsExpectedFormat()
    {
        // Arrange
        var vessel = Vessel.Create("1234567", "Name", Guid.NewGuid().ToString(), "Op");
        var expected = $"{vessel.Name} (IMO {vessel.ImoNumber}) - Operator: {vessel.Operator}";

        // Act
        var result = vessel.ToString();

        // Assert
        Assert.Equal(expected, result);
    }
}