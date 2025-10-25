# Port Project API

## 1. Project Overview

Port Project API is a RESTful web API for port operations management. It models core port back-office responsibilities such as staff and qualifications management, operational resources, docks and storage areas, vessel and vessel type management, shipping agents and representatives, and vessel visit notifications (including cargo, crew and decision logs).

This repository implements domain-driven design (aggregates and value objects) and uses Entity Framework Core with SQLite for persistence. The API aims to provide a pragmatic, well-structured backend for integration tests, demos and further development.

Key domain aggregates:
- StaffMember
- Qualification
- Resource
- Dock
- StorageArea
- VesselType
- Vessel
- ShippingAgentOrganization
- ShippingAgentRepresentative
- VesselVisitNotification

Main API controllers (examples):
- `StaffMembersController`
- `QualificationsController`
- `ResourceController`
- `StorageAreaController`
- `DockController`
- `VesselTypeController`
- `VesselController`
- `ShippingAgentOrganizationsController`
- `ShippingAgentRepresentativesController`
- `VesselVisitNotificationController`


## 2. Technologies

- .NET 9 (ASP.NET Core Web API)
- Entity Framework Core (EF Core)
- SQLite (file-based database)
- Swagger / Postman / OpenAPI (development only)


## 3. Requirements

- .NET SDK 9 or later
- (Optional) `dotnet-ef` tool for migrations


## 4. Build

From the repository root:

```powershell
# Restore and build (Windows PowerShell / cmd)
dotnet restore
dotnet build
```


## 5. Run

Run the API from the solution or the `PortProject.Api` project folder:

```powershell
# Run using dotnet run
dotnet run --project PortProject.Api
```

By default the app uses SQLite and a file named `portproject.db` in the working directory (configured in `PortProjectContext`).

When running in the Development environment the project exposes Swagger UI at `https://localhost:{PORT}/swagger`.


## 6. Database & Migrations

Install the EF Core CLI if you plan to manage migrations:

```powershell
dotnet tool install --global dotnet-ef
```

Create a migration and update the database (example):

```powershell
# From repository root
dotnet ef migrations add InitialCreate --project PortProject.Api --startup-project PortProject.Api
dotnet ef database update --project PortProject.Api --startup-project PortProject.Api
```

The project is configured to use a SQLite file by default. If you change the connection string, update `appsettings.json` or your environment variables accordingly.


## 7. API Endpoints (overview)

Base URL: `/api`

Common endpoints include (not exhaustive):
- `GET /api/StaffMembers` — list staff
- `POST /api/StaffMembers` — create staff member
- `GET /api/VesselTypes` — list vessel types
- `POST /api/VesselVisitNotification` — submit a vessel visit notification
- `GET /api/StorageArea` — manage storage areas
- `GET /api/Dock` — manage docks
- `GET /api/Resource` — manage resources

Refer to the Swagger UI for a complete list of endpoints, request/response schemas and example payloads.


## 8. Project Structure

Top-level folders of interest:
- `PortProject.Api/Controllers` — HTTP controllers
- `PortProject.Api/Domain` — domain model (aggregates, value objects, interfaces)
- `PortProject.Api/Application` — application services and DTOs
- `PortProject.Api/Infrastructure` — EF Core repositories and persistence
- `PortProject.Api/Models` — `AplicationContext` (EF Core DbContext)
- `*.Tests`, `*.System_Tests` and `*.IntegrationTests` — test projects


## 9. Tests

There are several test projects in the repository (unit, system tests, and integration tests). Run tests with:

```powershell
dotnet test
```


## 10. Troubleshooting

- Swagger not available: ensure `ASPNETCORE_ENVIRONMENT` is set to `Development`.
- Database errors after model changes: regenerate migrations and apply them, or delete `portproject.db` and run migrations to recreate the schema.
- Connection string: check `appsettings.json` for `DefaultConnection` or rely on the default SQLite config in `PortProjectContext`.

## 11. Contribution & Notes

- Coding follows DDD principles: aggregates, value objects and explicit repositories.
- Prefer adding migrations when modifying the domain model.
- Keep enum serialization stable (the project configures Newtonsoft.Json to serialize enums as strings).


## 12. Authors

Student team: Pedro Santos, Amir Masnavi, Leonor Marinho, Inês Oliveira, Mariana Sarmento.


## 13. License

This project is provided for academic purposes. Please consult the repository owner for any licensing or reuse policies.
