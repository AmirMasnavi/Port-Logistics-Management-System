
using System;
using PortProject.Api.Domain.DockAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.DockAggregate
{
    public class NumberOfStsCranesTest
    {
        // ===== Construtor =====

        [Fact]
        public void WhenValueIsValid_ThenCreatesNumberOfSTSCranes()
        {
            // Act
            var cranes = new NumberOfSTSCranes(5);

            // Assert
            Assert.Equal(5, cranes.Value);
        }

        [Fact]
        public void WhenValueIsZero_ThenCreatesSuccessfully()
        {
            // Act
            var cranes = new NumberOfSTSCranes(0);

            // Assert
            Assert.Equal(0, cranes.Value);
        }

        [Fact]
        public void WhenValueIsNegative_ThenThrowsArgumentException()
        {
            // Act & Assert
            var ex = Assert.Throws<ArgumentException>(() => new NumberOfSTSCranes(-2));
            Assert.Equal("value", ex.ParamName);
            Assert.Contains("não pode ser negativo", ex.Message);
        }

        // ===== Equals =====

        [Fact]
        public void Equals_ReturnsTrue_WhenValuesAreTheSame()
        {
            // Arrange
            var n1 = new NumberOfSTSCranes(3);
            var n2 = new NumberOfSTSCranes(3);

            // Act
            var result = n1.Equals(n2);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public void Equals_ReturnsFalse_WhenValuesDiffer()
        {
            // Arrange
            var n1 = new NumberOfSTSCranes(3);
            var n2 = new NumberOfSTSCranes(4);

            // Act
            var result = n1.Equals(n2);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public void Equals_ReturnsFalse_WhenObjectIsNullOrDifferentType()
        {
            // Arrange
            var cranes = new NumberOfSTSCranes(2);

            // Act & Assert
            Assert.False(cranes.Equals(null));
            Assert.False(cranes.Equals("string"));
        }

        // ===== GetHashCode =====

        [Fact]
        public void GetHashCode_IsConsistent_ForEqualObjects()
        {
            // Arrange
            var n1 = new NumberOfSTSCranes(7);
            var n2 = new NumberOfSTSCranes(7);

            // Act
            var hash1 = n1.GetHashCode();
            var hash2 = n2.GetHashCode();

            // Assert
            Assert.Equal(hash1, hash2);
        }

        [Fact]
        public void GetHashCode_DiffersForDifferentValues()
        {
            // Arrange
            var n1 = new NumberOfSTSCranes(2);
            var n2 = new NumberOfSTSCranes(5);

            // Act
            var hash1 = n1.GetHashCode();
            var hash2 = n2.GetHashCode();

            // Assert
            Assert.NotEqual(hash1, hash2);
        }

        // ===== ToString =====

        [Fact]
        public void ToString_ReturnsExpectedFormat_ForSingleCrane()
        {
            // Arrange
            var cranes = new NumberOfSTSCranes(1);

            // Act
            var result = cranes.ToString();

            // Assert
            Assert.Equal("1 STS Crane(s)", result);
        }

        [Fact]
        public void ToString_ReturnsExpectedFormat_ForMultipleCranes()
        {
            // Arrange
            var cranes = new NumberOfSTSCranes(4);

            // Act
            var result = cranes.ToString();

            // Assert
            Assert.Equal("4 STS Crane(s)", result);
        }
    }
}
