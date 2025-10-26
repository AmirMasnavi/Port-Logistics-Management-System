# Port Project - Testing Documentation

This document provides an overview of the testing strategy and organization for the Port Project API.

## Test Project Structure

The testing suite is organized into three main test projects, each serving a specific purpose in ensuring code quality and correctness.

---

## PortProject.Api.Tests

**Unit Tests** for individual components of the application.

This project contains isolated tests for:
- **Aggregates**: Tests for domain models and business logic (e.g., Vessel, VesselType, ShippingAgentOrganization)
- **Controllers**: Tests for API endpoint controllers and request/response handling
- **Services**: Tests for application services and business logic layers

Unit tests focus on testing individual components in isolation, using mocks and stubs for dependencies.

---

## PortProject.Api.Integration_Tests

**Integration Tests** for API endpoints and database interactions.

This project tests:
- End-to-end API endpoint functionality
- Database integration with real DbContext
- Request/response flows through the full stack
- Individual aggregate CRUD operations

Integration tests use a test database and verify that different layers of the application work correctly together.

**Test Files Include:**
- `VesselTypeTest.cs`
- `VesselTest.cs`
- `DockTest.cs`
- `StorageAreaTest.cs`
- `ShippingAgentOrganizationTest.cs`
- `ShippingAgentRepresentativeTest.cs`
- `VesselVisitNotificationTest.cs`
- `ResourceTest.cs`
- `QualificationTests.cs`
- `StaffMemberTests.cs`

---

## Port.Project.Api.System_Tests

**System Tests** for complete application workflows and data consistency.

This project contains two main test files:

### 1. DataConsistencySystemTests
Tests **dependencies and relationships between aggregates**, ensuring:
- Foreign key constraints are properly enforced
- Cascade delete behaviors work correctly
- Data integrity is maintained across related entities
- Business rules regarding entity relationships are validated

### 2. PortOperationsSystemTests
Tests the **complete end-to-end flow of the application**, simulating real-world scenarios:
- Creating all necessary entities (VesselTypes, Vessels, Docks, Organizations, Representatives)
- Submitting Vessel Visit Notifications
- Managing organization and representative lifecycles (CRUD operations)
- Verifying that the entire port operations workflow functions correctly from start to finish

System tests ensure that all components work together seamlessly in realistic usage scenarios.

---

## Running the Tests

### Run all tests:
```bash
dotnet test
```

### Run a specific test project:
```bash
dotnet test PortProject.Api.Tests
dotnet test PortProject.Api.Integration_Tests
dotnet test Port.Project.Api.System_Tests
```

### Run a specific test file:
```bash
dotnet test --filter "FullyQualifiedName~VesselTypeTest"
dotnet test --filter "FullyQualifiedName~PortOperationsSystemTests"
```

---

## Test Coverage

The testing strategy follows the **testing pyramid**:
- **Unit Tests** (PortProject.Api.Tests): Largest number of tests, fastest execution
- **Integration Tests** (PortProject.Api.Integration_Tests): Medium number of tests, moderate execution time
- **System Tests** (Port.Project.Api.System_Tests): Smaller number of tests, comprehensive scenarios

This approach ensures thorough coverage while maintaining fast feedback loops during development.

