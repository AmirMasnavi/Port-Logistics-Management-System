using System;
using PortProject.Api.Domain.VesselAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.VesselAggregate;

public class ImoNumberTest
{
    [Theory]
    [InlineData("1234567")] // valid: checksum 7
    [InlineData("0000000")] // 0*weights => 0, check 0
    [InlineData("1111117")] // 1*7+1*6+1*5+1*4+1*3+1*2=27 => check 7
    public void WhenPassingValidImo_ThenImoNumberIsInstantiated(string value)
    {
        var imo = new ImoNumber(value);
        Assert.NotNull(imo);
        Assert.Equal(value, imo.Value);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void WhenPassingNullOrEmpty_ThenThrowsArgumentException(string value)
    {
        var ex = Assert.Throws<ArgumentException>(() => new ImoNumber(value));
        Assert.Equal("value", ex.ParamName);
        Assert.Contains("cannot be null or empty", ex.Message);
    }

    [Theory]
    [InlineData("123456")]   // too short
    [InlineData("12345678")] // too long
    [InlineData("ABCDEF1")]  // non-digit
    public void WhenPassingWrongFormat_ThenThrowsArgumentException(string value)
    {
        var ex = Assert.Throws<ArgumentException>(() => new ImoNumber(value));
        Assert.Equal("value", ex.ParamName);
        Assert.Contains("Invalid IMO number format", ex.Message);
    }

    [Fact]
    public void WhenPassingWrongCheckDigit_ThenThrowsArgumentException()
    {
        var ex = Assert.Throws<ArgumentException>(() => new ImoNumber("1234560")); // checksum should be 7
        Assert.Equal("value", ex.ParamName);
        Assert.Contains("Invalid IMO number format", ex.Message);
    }

    [Fact]
    public void WhenValueHasWhitespace_ThenItIsTrimmedAndValid()
    {
        var imo = new ImoNumber(" 1234567 ");
        Assert.Equal("1234567", imo.Value);
    }

    [Fact]
    public void ToString_ReturnsValue()
    {
        var imo = new ImoNumber("1234567");
        Assert.Equal("1234567", imo.ToString());
    }

    [Fact]
    public void ImplicitConversion_ToString_ReturnsUnderlyingValue()
    {
        ImoNumber imo = new("1234567");
        string asString = imo; // implicit
        Assert.Equal("1234567", asString);
    }

    [Fact]
    public void Equality_SameValue_ReturnsTrue_AndHashCodesMatch()
    {
        var a = new ImoNumber("1234567");
        var b = new ImoNumber("1234567");
        var c = new ImoNumber("0000000");

        Assert.True(a.Equals(b));
        Assert.Equal(a.GetHashCode(), b.GetHashCode());
        Assert.False(a.Equals(c));
    }
}
