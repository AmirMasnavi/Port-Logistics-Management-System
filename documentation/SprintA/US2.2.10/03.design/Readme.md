# View the Status of Vessel Visit Notifications – Design

## 3.1. Rationale

The design follows a layered architecture, ensuring separation of concerns between API, application logic, domain model, and persistence. Since this is a read-oriented use case, the focus is on secure access, filtering, and projection of domain entities into DTOs.

| Interaction                    | Question: Which class is responsible for...               | Answer                                   | Justification (with patterns)                                                                                                                                     |
|:-------------------------------|:----------------------------------------------------------|:-----------------------------------------|:------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Step 1 (Receive Request)**   | ...handling the HTTP GET request from the actor?          | `VesselVisitNotificationController`      | **Controller (GRASP):** Handles HTTP requests, parses query parameters into a filter DTO, and delegates to the service layer.                                     |
|                                | ...coordinating the filtering and retrieval logic?        | `VesselVisitNotificationService`         | **Service Layer / Pure Fabrication:** Orchestrates the use case by applying filters, invoking the repository, and mapping results to DTOs.                        |
| **Step 2 (Execute Logic)**     | ...enforcing access control (same organization)?          | `VesselVisitNotificationService`         | **Controller + Service Collaboration:** The controller provides the authenticated user's organization ID; the service ensures all queries are scoped accordingly. |
|                                | ...filtering by vessel, status, representative, and time? | `IVesselVisitNotificationRepository`     | **Repository / Expert:** The repository is responsible for querying the database using the provided filters, ensuring efficient and secure data access.           |
| **Step 3 (Project Results)**   | ...mapping domain entities to DTOs for the response?      | `VesselVisitNotificationService`         | **Service Layer / DTO:** Uses a private MapToDto method to transform domain entities into VesselVisitNotificationDto objects for the client.                      |
| **Step 4 (Send Response)**     | ...returning the filtered list to the client?             | `VesselVisitNotificationController`      | **Controller:** Returns the list of DTOs with HTTP 200 OK, completing the request-response cycle.                                                                 |

## 3.2. Design 

This diagram shows the sequence of interactions for the **View and Filter Vessel Visit Notifications** scenario, including filtering by vessel, status, representative, and time.

![Sequence Diagram](svg/Us2.2.10-design-diagram.svg)
