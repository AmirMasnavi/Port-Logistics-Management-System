# US 2.2.11 - Design

## 3.1. Rationale

The design follows a standard layered architecture, consistent with the provided C# code. The responsibilities are clearly separated to promote high cohesion and low coupling.

| Interaction ID | Question: Which class is responsible for... | Answer | Justification (with patterns) |
| :--- | :--- | :--- | :--- |
| Step 1 (Receive Request) | ...handling the HTTP request and interacting with the actor? | `StaffMembersController` | **Controller (GRASP):** This class is the entry point for UI interactions. It translates HTTP requests into calls to the application service. |
| | ...coordinating the use case steps? | `StaffMemberService` | **Service Layer / Pure Fabrication:** It orchestrates the business logic, coordinating between repositories and domain entities without containing business rules itself. |
| Step 2 (Execute Logic) | ...finding the `StaffMember` aggregate or checking for duplicates? | `IStaffMemberRepository` | **Repository:** Abstracts data access, providing a clean interface for querying and persisting `StaffMember` aggregates. |
| | ...creating a `StaffMember` and ensuring its internal consistency? | `StaffMember` | **Information Expert (GRASP):** The aggregate root is the expert on its own creation, validation, and state transitions. |
| Step 3 (Persist State) | ...persisting the new or modified `StaffMember`? | `IStaffMemberRepository` | **Repository:** Responsible for saving the state of the `StaffMember` aggregate to the database. |
| Step 4 (Send Response) | ...preparing the data (DTO) for the response? | `StaffMemberService` / `Controller` | **Controller:** The service returns a result, and the controller formats it into an HTTP response with the appropriate status code and DTO. |

## 3.2. Sequence Diagram (SD)

This diagram shows the sequence of interactions for the **Create Staff Member** operation. This flow is representative of other operations like updating status.

![Sequence Diagram - Full](svg/us2.2.11-sequence-diagram.svg)
*(Diagram generated from [us2.2.11-sequence-diagram.puml](puml/us2.2.11-sequence-diagram.puml))*

## 3.3. Class Diagram (CD)

This diagram shows the main classes involved in this use case and their relationships, directly reflecting the provided C# project structure.

![Class Diagram](svg/us2.2.11-class-diagram.svg)
*(Diagram generated from [us2.2.11-class-diagram.puml](puml/us2.2.11-class-diagram.puml))*