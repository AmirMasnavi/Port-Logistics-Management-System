// using System;
// using System.Linq;
// using System.Threading.Tasks;
// using Microsoft.EntityFrameworkCore;
// using Microsoft.Data.Sqlite;
// using PortProject.Api.Application.Resources.DTOs;
// using PortProject.Api.Application.Resources.Services;
// using PortProject.Api.Domain.ResourceAggregate;
// using PortProject.Api.Models;
// using Xunit;
//
// namespace PortProject.Api.Tests.Application.Resource.Services;
//
// public class ResourceServiceTest
// {
//     private sealed class TestPortProjectContext : PortProjectContext
//     {
//         public TestPortProjectContext(DbContextOptions<PortProjectContext> options) : base(options) {}
//         protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
//         {
//             // Override to avoid the base UseSqlite hard-coded connection; use provided options instead.
//         }
//     }
//
//     private static TestPortProjectContext CreateInMemoryContext(string name)
//     {
//         var options = new DbContextOptionsBuilder<PortProjectContext>()
//             .UseInMemoryDatabase(databaseName: name)
//             .Options;
//         var ctx = new TestPortProjectContext(options);
//         ctx.Database.EnsureCreated();
//         return ctx;
//     }
//
//     private static TestPortProjectContext CreateSqliteInMemoryContext()
//     {
//         var connection = new SqliteConnection("DataSource=:memory:");
//         connection.Open();
//         var options = new DbContextOptionsBuilder<PortProjectContext>()
//             .UseSqlite(connection)
//             .Options;
//         var ctx = new TestPortProjectContext(options);
//         ctx.Database.EnsureCreated();
//         return ctx;
//     }
//
//     [Fact]
//     public async Task CreateResourceAsync_ValidCrane_PersistsAndReturnsDto()
//     {
//         await using var ctx = CreateInMemoryContext(nameof(CreateResourceAsync_ValidCrane_PersistsAndReturnsDto));
//         var service = new ResourceService(ctx);
//
//         var dto = new CreateResourceDto
//         {
//             Code = "res-001",
//             Description = "Main Crane",
//             Kind = "Crane",
//             Status = "Active",
//             SetupTimeMinutes = 5,
//             OperationalWindowStart = new TimeOnly(8, 0),
//             OperationalWindowEnd = new TimeOnly(18, 0),
//             AverageContainersPerHour = 20
//         };
//
//         var result = await service.CreateResourceAsync(dto);
//
//         Assert.NotNull(result);
//         Assert.Equal("res-001", result.Code);
//         Assert.Equal("Main Crane", result.Description);
//         Assert.Equal("Crane", result.Kind);
//         Assert.Equal("Active", result.Status);
//         Assert.Equal(5, result.SetupTimeMinutes);
//         Assert.Equal("08:00", result.OperationalWindowStart);
//         Assert.Equal("18:00", result.OperationalWindowEnd);
//         Assert.Equal(20, result.AverageContainersPerHour);
//         Assert.Null(result.ContainersPerTrip);
//         Assert.Equal(1, ctx.Resources.Count());
//
//         // NOTE: We intentionally don't assert duplicate creation behavior here because
//         // the EF Core InMemory provider doesn't enforce uniqueness the same way as the
//         // production database/provider would. That behavior is covered by integration tests.
//     }
//
//     [Fact]
//     public async Task CreateResourceAsync_InvalidOrMissingKind_Throws()
//     {
//         await using var ctx = CreateInMemoryContext(nameof(CreateResourceAsync_InvalidOrMissingKind_Throws));
//         var service = new ResourceService(ctx);
//
//         var baseDto = new CreateResourceDto
//         {
//             Code = "res-002",
//             Description = "Whatever",
//             Status = "Active",
//             SetupTimeMinutes = 1,
//             OperationalWindowStart = new TimeOnly(9, 0),
//             OperationalWindowEnd = new TimeOnly(17, 0)
//         };
//
//         var missingKind = new CreateResourceDto
//         {
//             Code = baseDto.Code,
//             Description = baseDto.Description,
//             // Kind intentionally omitted to simulate missing value
//             Status = baseDto.Status,
//             SetupTimeMinutes = baseDto.SetupTimeMinutes,
//             OperationalWindowStart = baseDto.OperationalWindowStart,
//             OperationalWindowEnd = baseDto.OperationalWindowEnd
//         };
//         var ex1 = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateResourceAsync(missingKind));
//         Assert.Equal("Kind", ex1.ParamName);
//
//         var invalidKind = new CreateResourceDto
//         {
//             Code = baseDto.Code,
//             Description = baseDto.Description,
//             Kind = "Banana",
//             Status = baseDto.Status,
//             SetupTimeMinutes = baseDto.SetupTimeMinutes,
//             OperationalWindowStart = baseDto.OperationalWindowStart,
//             OperationalWindowEnd = baseDto.OperationalWindowEnd
//         };
//         var ex2 = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateResourceAsync(invalidKind));
//         Assert.Equal("Kind", ex2.ParamName);
//     }
//
//     [Fact]
//     public async Task CreateResourceAsync_InvalidStatus_Throws()
//     {
//         await using var ctx = CreateInMemoryContext(nameof(CreateResourceAsync_InvalidStatus_Throws));
//         var service = new ResourceService(ctx);
//
//         var dto = new CreateResourceDto
//         {
//             Code = "res-003",
//             Description = "desc",
//             Kind = "Crane",
//             Status = "UnknownStatus",
//             SetupTimeMinutes = 1,
//             OperationalWindowStart = new TimeOnly(9, 0),
//             OperationalWindowEnd = new TimeOnly(17, 0),
//             AverageContainersPerHour = 5
//         };
//
//         var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateResourceAsync(dto));
//         Assert.Equal("Status", ex.ParamName);
//     }
//
//     [Fact]
//     public async Task CreateResourceAsync_TruckMissingRequiredFields_Throws()
//     {
//         await using var ctx = CreateInMemoryContext(nameof(CreateResourceAsync_TruckMissingRequiredFields_Throws));
//         var service = new ResourceService(ctx);
//
//         // Missing ContainersPerTrip
//         var dto1 = new CreateResourceDto
//         {
//             Code = "res-004",
//             Description = "truck",
//             Kind = "Truck",
//             Status = "Active",
//             SetupTimeMinutes = 1,
//             OperationalWindowStart = new TimeOnly(9, 0),
//             OperationalWindowEnd = new TimeOnly(17, 0),
//             AverageSpeedKmh = 30
//         };
//         var ex1 = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateResourceAsync(dto1));
//         Assert.Equal("ContainersPerTrip", ex1.ParamName);
//
//         // Missing AverageSpeedKmh
//         var dto2 = new CreateResourceDto
//         {
//             Code = "res-005",
//             Description = "truck",
//             Kind = "Truck",
//             Status = "Active",
//             SetupTimeMinutes = 1,
//             OperationalWindowStart = new TimeOnly(9, 0),
//             OperationalWindowEnd = new TimeOnly(17, 0),
//             ContainersPerTrip = 1
//         };
//         var ex2 = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateResourceAsync(dto2));
//         Assert.Equal("AverageSpeedKmh", ex2.ParamName);
//     }
//
//     [Fact]
//     public async Task CreateResourceAsync_OtherMissingRequiredFields_Throws()
//     {
//         await using var ctx = CreateInMemoryContext(nameof(CreateResourceAsync_OtherMissingRequiredFields_Throws));
//         var service = new ResourceService(ctx);
//
//         var dto = new CreateResourceDto
//         {
//             Code = "res-006",
//             Description = "other",
//             Kind = "Other",
//             Status = "Active",
//             SetupTimeMinutes = 1,
//             OperationalWindowStart = new TimeOnly(9, 0),
//             OperationalWindowEnd = new TimeOnly(17, 0)
//         };
//
//         var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateResourceAsync(dto));
//         Assert.Equal("OtherUnit", ex.ParamName);
//     }
//
//     [Fact]
//     public async Task GetByCodeAsync_ReturnsDto_WhenExists()
//     {
//         await using var ctx = CreateSqliteInMemoryContext();
//         var service = new ResourceService(ctx);
//
//         var dto = new CreateResourceDto
//         {
//             Code = "res-007",
//             Description = "find me",
//             Kind = "Crane",
//             Status = "Active",
//             SetupTimeMinutes = 1,
//             OperationalWindowStart = new TimeOnly(8, 0),
//             OperationalWindowEnd = new TimeOnly(18, 0),
//             AverageContainersPerHour = 12
//         };
//         await service.CreateResourceAsync(dto);
//
//         // Lookup using the same normalized casing to avoid provider-specific case-sensitivity surprises
//         var found = await service.GetByCodeAsync("res-007");
//         Assert.NotNull(found);
//         Assert.Equal("res-007", found!.Code);
//     }
//
//     [Theory]
//     [InlineData(null)]
//     [InlineData("")]
//     [InlineData(" ")]
//     public async Task GetByCodeAsync_NullOrWhitespace_ReturnsNull(string code)
//     {
//         await using var ctx = CreateInMemoryContext(nameof(GetByCodeAsync_NullOrWhitespace_ReturnsNull) + code);
//         var service = new ResourceService(ctx);
//         var result = await service.GetByCodeAsync(code);
//         Assert.Null(result);
//     }
// }