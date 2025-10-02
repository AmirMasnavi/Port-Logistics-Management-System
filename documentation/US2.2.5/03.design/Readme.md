# US2.2.5 - Register Shipping Agent Organization

## 3. Design - User Story Realization

### 3.1. Rationale

_**Note: The design below is based on the provided Sequence Diagram for US2.2.5. SSD steps are inferred from the "Requirements Engineering" section of US2.2.5 for this rationale table. The process is divided into stages as shown in the SD.**_

| Interaction ID (Inferred SSD Step)                                       | Question: Which class is responsible for...                                                      | Answer                               | Justification (with patterns)                                                                                                                                                                                                |
|:---------------------------------------------------------------------------|:-------------------------------------------------------------------------------------------------|:-------------------------------------|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Initiation & Representative Data Collection**                              |                                                                                                  |                                      |                                                                                                                                                                                                                              |
| Step 1 (Port Authority Officer requests to register a new Shipping Agent Organization)              | ... interacting with the actor (Port Authority Officer) for organization registration?                     | `RegisterShippingAgentOrgUI`                 | **Pure Fabrication / IE:** No domain class is suitable. Responsible for overall user interaction, displaying forms, and collecting input for both representative and organization.                                          |
|                                                                            | ... coordinating the overall organization registration use case?                                       | `RegisterShippingAgentOrgController`         | **Controller:** Receives UI events, manages the flow between collecting representative and organization data, and delegates to service layers.                                                                     |
| Step 2 (System requests and Actor submits Representative data)      | ... ensuring the current user is authorized to initiate registration?                            | `AuthorizationService`               | **Information Expert (IE) / Service (Framework):** Encapsulates authorization logic. The controller delegates to it.                                                                                               |
|                                                                            | ... creating a transient `ShippingAgentRepresentative` entity from the provided data?                 | `RegisterShippingAgentOrgController`         | **Creator / Controller:** The Controller takes the raw data from the UI and is responsible for instantiating the `ShippingAgentRepresentative` entity in memory (transient state). It doesn't save it yet.                          |
|                                                                            |                                                                                                  | or `ShippingAgentRepresentative` (static factory method) | **Creator (Alternative):** The `ShippingAgentRepresentative` entity itself could have a static factory method `create(...)` that the Controller calls.                                                                      |
| **Organization Data Collection & Persistence**                                   |                                                                                                  |                                      |                                                                                                                                                                                                                              |
| Step 3 (System requests and Actor submits Organization data, including transient representative) | ... delegating the core business logic of registering the organization and its representative? | `ShippingAgentOrgService`                    | **Application Service / Pure Fabrication:** Encapsulates the application-level logic for registering an organization, including transaction management and coordination with repositories.                               |
|                                                                            | ... ensuring the current user is authorized to perform the final registration?                 | `AuthorizationService`               | **Information Expert (IE) / Service (Framework):** Re-checked or confirmed by the `ShippingAgentOrgService`.                                                                                                         |
|                                                                            | ... providing access to repositories (e.g., `ShippingAgentOrganizationRepository`)?                             | `PersistenceContext`                 | **Facade / Pure Fabrication:** Acts as a gateway to obtain repository instances, abstracting the specific mechanism of repository retrieval (e.g., from a DI container or a JPA EntityManager).                             |
|                                                                            | ... creating the `ShippingAgentOrganization` aggregate root, associating the transient `ShippingAgentRepresentative`?    | `ShippingAgentOrgService`                    | **Creator / Application Service:** The `ShippingAgentOrgService` is responsible for instantiating the `ShippingAgentOrganization` aggregate, ensuring the previously created `ShippingAgentRepresentative` is correctly associated.                 |
|                                                                            |                                                                                                  | or `ShippingAgentOrganization` (constructor/factory) | **Creator (Alternative):** The `ShippingAgentOrganization` aggregate root itself could have a constructor or factory method that takes the representative data/object.                                                              |
|                                                                            | ... saving the `ShippingAgentOrganization` aggregate (which then cascades to save the `ShippingAgentRepresentative`)?  | `ShippingAgentOrganizationRepository`                 | **Information Expert (IE):** Knows how to persist the `ShippingAgentOrganization` aggregate. Due to cascading rules (e.g., `CascadeType.ALL`), persisting the Organization also persists its associated Representative. |
| Step 4 (System displays success message)                                     | ... informing the Port Authority Officer of the operation's success or failure?                        | `RegisterShippingAgentOrgUI`                 | **Information Expert (IE):** Responsible for presenting feedback to the user.                                                                                                                               |

### Systematization

According to the taken rationale, the conceptual classes (Domain Entities and Aggregates) promoted to software classes are:

*   `ShippingAgentOrganization` (Aggregate Root)
*   `ShippingAgentRepresentative` (Entity, part of the `ShippingAgentOrganization` aggregate)

Other software classes (i.e. Pure Fabrication, Controllers, UI, Application Services, Framework components/services, Repositories) identified:

*   **Presentation Layer:**
    *   `RegisterShippingAgentOrgUI`
*   **Application Layer:**
    *   `RegisterShippingAgentOrgController`
    *   `ShippingAgentOrgService` (Application Service)
*   **Framework/Infrastructure Layer (Services, Repositories, Components, Facades):**
    *   `AuthzRegistry` (Implied Facade for `AuthorizationService` access, though diagram shows direct use)
    *   `AuthorizationService`
    *   `PersistenceContext` (Facade for repository access)
    *   `ShippingAgentOrganizationRepository` (Interface for `ShippingAgentOrganization` aggregate persistence)

## 3.2. Sequence Diagram (SD)

### Full Diagram

This diagram shows the full sequence of interactions between the classes involved in the realization of this user story.

![Full Sequence Diagram](svg/US2.2.5-design-diagram.svg)