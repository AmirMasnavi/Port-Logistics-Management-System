using Microsoft.VisualStudio.TestTools.UnitTesting;
using PortProject.Api.Domain.QualificationAggregate;
using System;

namespace PortProject.Api.Tests.Domain.QualificationAggregate;

[TestClass]
public class QualificationTests
{
    [TestMethod]
    public void Constructor_WithValidData_ShouldCreateInstance()
    {
        // Arrange
        var code = new QualificationCode("VALID-CODE");
        var name = new QualificationName("Valid Name");
        var description = new QualificationDescription("Valid Description");

        // Act
        var qualification = new Qualification(code, name, description);

        // Assert
        Assert.IsNotNull(qualification);
        Assert.AreEqual(code, qualification.Code);
        Assert.AreEqual(name, qualification.Name);
    }

    [TestMethod]
    [DataRow(null, "Name", "Desc")]
    [DataRow("Code", null, "Desc")]
    [DataRow("Code", "Name", null)]
    public void Constructor_WithNullArgument_ShouldThrowArgumentNullException(string? code, string? name, string? desc)
    {
        // Arrange
        var qualCode = code == null ? null : new QualificationCode(code);
        var qualName = name == null ? null : new QualificationName(name);
        var qualDesc = desc == null ? null : new QualificationDescription(desc);

        // Act & Assert
        Assert.ThrowsException<ArgumentNullException>(() => 
            new Qualification(qualCode!, qualName!, qualDesc!)
        );
    }

    [TestMethod]
    public void QualificationCode_WithEmptyValue_ShouldThrowArgumentException()
    {
        // Act & Assert
        Assert.ThrowsException<ArgumentException>(() => new QualificationCode(" "));
    }
}