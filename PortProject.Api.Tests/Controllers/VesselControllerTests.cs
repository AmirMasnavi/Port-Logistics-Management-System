using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using PortProject.Api.Controllers;
using src.Application.Services;
using PortProject.Api.Domain.VesselAggregate;

namespace PortProject.Api.Tests.Controllers
{
    [TestClass]
    public class VesselControllerTests
    {
        private readonly Mock<IVesselService> _mockService;
        private readonly VesselController _controller;

        public VesselControllerTests()
        {
            _mockService = new Mock<IVesselService>();
            _controller = new VesselController(_mockService.Object);
        }

        [TestMethod]
        public async Task CreateVessel_WithValidDto_ShouldReturnCreatedAtAction()
        {
            // Arrange
            var createDto = new VesselCreateDto
            {
                ImoNumber = "1234567",
                Name = "TestVessel",
                VesselTypeId = "vt1",
                Operator = "Op"
            };

            var expected = new VesselDto
            {
                ImoNumber = "1234567",
                Name = "TestVessel",
                VesselTypeId = "vt1",
                Operator = "Op"
            };

            _mockService
                .Setup(s => s.CreateVesselAsync(It.Is<VesselCreateDto>(d => d.ImoNumber == createDto.ImoNumber && d.Name == createDto.Name)))
                .ReturnsAsync(expected);

            // Act
            var result = await _controller.CreateVessel(createDto);

            // Assert
            Assert.IsInstanceOfType(result.Result, typeof(CreatedAtActionResult));
            var created = (CreatedAtActionResult)result.Result;
            Assert.AreEqual(201, created.StatusCode);
            Assert.IsNotNull(created.Value);
            var returned = created.Value as VesselDto;
            Assert.IsNotNull(returned);
            Assert.AreEqual(expected.ImoNumber, returned.ImoNumber);
            Assert.AreEqual(expected.Name, returned.Name);
        }

        [TestMethod]
        public async Task GetVesselByImo_WhenNotFound_ShouldReturnNotFound()
        {
            // Arrange
            var imo = "9999999";
            _mockService
                .Setup(s => s.GetVesselByImoAsync(imo))
                .ReturnsAsync((VesselDto)null);

            // Act
            var result = await _controller.GetVesselByImo(imo);

            // Assert
            Assert.IsInstanceOfType(result.Result, typeof(NotFoundObjectResult));
            var notFound = (NotFoundObjectResult)result.Result;
            Assert.AreEqual(404, notFound.StatusCode);
        }

        [TestMethod]
        public async Task UpdateVessel_ImoMismatch_ShouldReturnBadRequest()
        {
            // Arrange
            var imo = "1111111";
            var dto = new VesselDto { ImoNumber = "2222222", Name = "X", VesselTypeId = "vt", Operator = "op" };

            // Act
            var result = await _controller.UpdateVessel(imo, dto);

            // Assert
            Assert.IsInstanceOfType(result.Result, typeof(BadRequestObjectResult));
            var bad = (BadRequestObjectResult)result.Result;
            Assert.AreEqual(400, bad.StatusCode);
        }

        [TestMethod]
        public async Task DeleteVessel_WhenServiceThrowsKeyNotFound_ShouldReturnNotFound()
        {
            // Arrange
            var imo = "55";
            _mockService
                .Setup(s => s.DeleteVesselAsync(imo))
                .ThrowsAsync(new KeyNotFoundException("not found"));

            // Act
            var result = await _controller.DeleteVessel(imo);

            // Assert
            Assert.IsInstanceOfType(result, typeof(NotFoundObjectResult));
            var notFound = (NotFoundObjectResult)result;
            Assert.AreEqual(404, notFound.StatusCode);
        }

        [TestMethod]
        public async Task DeleteVessel_Success_ShouldReturnNoContent()
        {
            // Arrange
            var imo = "55";
            _mockService
                .Setup(s => s.DeleteVesselAsync(imo))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.DeleteVessel(imo);

            // Assert
            Assert.IsInstanceOfType(result, typeof(NoContentResult));
            var noContent = (NoContentResult)result;
            Assert.AreEqual(204, noContent.StatusCode);
        }

        [TestMethod]
        public async Task SearchVessels_WithQuery_ShouldReturnOkWithList()
        {
            // Arrange
            var list = new List<VesselDto>
            {
                new VesselDto { ImoNumber = "1234567", Name = "A", VesselTypeId = "vt1", Operator = "op1" }
            };

            _mockService
                .Setup(s => s.SearchVesselsAsync("1234567", null, null))
                .ReturnsAsync(list);

            // Act
            var result = await _controller.SearchVessels("1234567", null, null);

            // Assert
            Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
            var ok = (OkObjectResult)result.Result;
            Assert.AreEqual(200, ok.StatusCode);
            var returned = ok.Value as IEnumerable<VesselDto>;
            Assert.IsNotNull(returned);
        }
    }
}

