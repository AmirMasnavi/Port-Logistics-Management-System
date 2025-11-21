// using System;
// using PortProject.Api.Domain.ShippingAgentOrganizationAggregate;
// using Xunit;
//
// namespace PortProject.Api.Tests.Domain.ShippingAgentOrganizationAggregate
// {
//     public class AddressTests
//     {
//         // ✅ Constructor Tests
//         [Fact]
//         public void Constructor_ValidValues_ShouldCreateAddress()
//         {
//             var address = new Address("Rua 1", "Porto", "Portugal");
//
//             Assert.Equal("Rua 1", address.Street);
//             Assert.Equal("Porto", address.City);
//             Assert.Equal("Portugal", address.Country);
//         }
//
//         [Theory]
//         [InlineData(null, "City", "Country")]
//         [InlineData("", "City", "Country")]
//         [InlineData("   ", "City", "Country")]
//         public void Constructor_InvalidStreet_ShouldThrow(string street, string city, string country)
//         {
//             var ex = Assert.Throws<ArgumentException>(() => new Address(street, city, country));
//             Assert.Equal("street", ex.ParamName);
//         }
//
//         [Theory]
//         [InlineData("Street", null, "Country")]
//         [InlineData("Street", "", "Country")]
//         [InlineData("Street", "   ", "Country")]
//         public void Constructor_InvalidCity_ShouldThrow(string street, string city, string country)
//         {
//             var ex = Assert.Throws<ArgumentException>(() => new Address(street, city, country));
//             Assert.Equal("city", ex.ParamName);
//         }
//
//         [Theory]
//         [InlineData("Street", "City", null)]
//         [InlineData("Street", "City", "")]
//         [InlineData("Street", "City", "   ")]
//         public void Constructor_InvalidCountry_ShouldThrow(string street, string city, string country)
//         {
//             var ex = Assert.Throws<ArgumentException>(() => new Address(street, city, country));
//             Assert.Equal("country", ex.ParamName);
//         }
//
//         // ✅ Parse() Tests
//         [Fact]
//         public void Parse_ValidFullAddress_ShouldReturnAddress()
//         {
//             var address = Address.Parse("Rua das Flores, Porto, Portugal");
//
//             Assert.Equal("Rua das Flores", address.Street);
//             Assert.Equal("Porto", address.City);
//             Assert.Equal("Portugal", address.Country);
//         }
//
//         [Fact]
//         public void Parse_TwoParts_ShouldAssignUnknownCountry()
//         {
//             var address = Address.Parse("Rua, Porto");
//
//             Assert.Equal("Rua", address.Street);
//             Assert.Equal("Porto", address.City);
//             Assert.Equal("unknown", address.Country);
//         }
//
//         [Fact]
//         public void Parse_SinglePart_ShouldAssignUnknownCityAndCountry()
//         {
//             var address = Address.Parse("Rua");
//
//             Assert.Equal("Rua", address.Street);
//             Assert.Equal("unknown", address.City);
//             Assert.Equal("unknown", address.Country);
//         }
//
//         [Theory]
//         [InlineData("")]
//         [InlineData(" ")]
//         [InlineData(null)]
//         public void Parse_InvalidInput_ShouldThrow(string input)
//         {
//             var ex = Assert.Throws<ArgumentException>(() => Address.Parse(input));
//             Assert.Equal("fullAddress", ex.ParamName);
//         }
//
//         // ✅ Empty Property
//         [Fact]
//         public void Empty_ShouldReturnDefaultAddress()
//         {
//             var empty = Address.Empty;
//             Assert.Equal("N/A", empty.Street);
//             Assert.Equal("N/A", empty.City);
//             Assert.Equal("N/A", empty.Country);
//         }
//
//         // ✅ Equality Tests
//         [Fact]
//         public void Equals_SameValues_ShouldBeTrue()
//         {
//             var a1 = new Address("Rua 1", "Porto", "Portugal");
//             var a2 = new Address("Rua 1", "Porto", "Portugal");
//
//             Assert.True(a1.Equals(a2));
//             Assert.True(a1 == a2);
//             Assert.False(a1 != a2);
//         }
//
//         [Fact]
//         public void Equals_DifferentValues_ShouldBeFalse()
//         {
//             var a1 = new Address("Rua 1", "Porto", "Portugal");
//             var a2 = new Address("Rua 2", "Lisboa", "Portugal");
//
//             Assert.False(a1.Equals(a2));
//             Assert.False(a1 == a2);
//             Assert.True(a1 != a2);
//         }
//
//         [Fact]
//         public void Equals_IgnoreCase_ShouldReturnTrue()
//         {
//             var a1 = new Address("Rua 1", "PORTO", "PORTUGAL");
//             var a2 = new Address("rua 1", "porto", "portugal");
//
//             Assert.True(a1.Equals(a2));
//         }
//
//         [Fact]
//         public void Equals_Null_ShouldReturnFalse()
//         {
//             var a1 = new Address("Rua 1", "Porto", "Portugal");
//             Assert.False(a1.Equals(null));
//         }
//
//         [Fact]
//         public void Equals_SameReference_ShouldReturnTrue()
//         {
//             var a1 = new Address("Rua 1", "Porto", "Portugal");
//             Assert.True(a1.Equals(a1));
//         }
//
//         // ✅ GetHashCode Tests
//         [Fact]
//         public void GetHashCode_SameValues_ShouldBeEqual()
//         {
//             var a1 = new Address("Rua 1", "Porto", "Portugal");
//             var a2 = new Address("rua 1", "PORTO", "PORTUGAL");
//
//             Assert.Equal(a1.GetHashCode(), a2.GetHashCode());
//         }
//
//         [Fact]
//         public void GetHashCode_DifferentValues_ShouldBeDifferent()
//         {
//             var a1 = new Address("Rua 1", "Porto", "Portugal");
//             var a2 = new Address("Rua 2", "Lisboa", "Portugal");
//
//             Assert.NotEqual(a1.GetHashCode(), a2.GetHashCode());
//         }
//
//         // ✅ ToString Tests
//         [Fact]
//         public void ToString_ShouldReturnFormattedString()
//         {
//             var address = new Address("Rua 1", "Porto", "Portugal");
//             Assert.Equal("Rua 1, Porto, Portugal", address.ToString());
//         }
//     }
// }
