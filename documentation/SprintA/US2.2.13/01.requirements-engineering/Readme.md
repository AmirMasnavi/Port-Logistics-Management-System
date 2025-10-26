# US 2.2.13: Manage Qualifications - Requirements Engineering

## 1. Requirements Engineering

### 1.1. User Story Description

As a Logistics Operator, I want to register and manage qualifications (create, update), so that staff members and resources can be consistently associated with the correct skills and certifications required for port operations.

### 1.2. Customer Specifications and Clarifications

* **Purpose:** Qualifications represent specific skills or certifications (e.g., "STS Crane Operator," "Truck Driver").
* **Association:** They serve as a link between the requirements of certain physical resources (e.g., an STS crane requires a certified operator) and the capabilities of staff members.
* **Uniqueness:** Each qualification must have a unique identifier (code).

### 1.3. Acceptance Criteria

* **AC1:** Each qualification has a unique code and a descriptive name.
* **AC2:** The system must allow the Logistics Operator to create new qualifications by providing the code and name.
* **AC3:** The system must allow the Logistics Operator to update the name and description of existing qualifications.
* **AC4:** Qualifications must be searchable and filterable by code or name.
* **AC5:** A qualification must exist before it can be assigned to staff members or resources.

### 1.4. Found out Dependencies

* **US 2.2.11 (Manage Staff Members):** This user story (2.2.13) is a prerequisite for assigning qualifications to staff members. The `StaffMemberService` relies on the existence of qualifications defined here.
* **US 2.2.17 (Manage Physical Resources):** This user story (2.2.13) is a prerequisite for defining qualification requirements for physical resources. The `ResourceService` relies on existing qualifications.

### 1.5. Input and Output Data

**Input Data (Create Qualification):**

* Corresponds to `CreateQualificationDto`.
* `Code` (string): Unique identifier (e.g., "STS-OP", "TRUCK-DRV").
* `Name` (string): Descriptive name (e.g., "STS Crane Operator").
* `Description` (string): Optional longer description.

**Output Data (Create Qualification):**

* **Success:** A `QualificationDto` with the new qualification details and an HTTP 201 Created status.
* **Failure:** An HTTP 400 Bad Request if validation fails (e.g., code format, name length) or if the code already exists.

**Input Data (Update Qualification):**

* Corresponds to `UpdateQualificationDto`.
* `qualificationCode` (string, from URL path).
* `Name` (string): New descriptive name.
* `Description` (string): New optional description.

**Output Data (Update Qualification):**

* **Success:** A `QualificationDto` with the updated details and an HTTP 200 OK status.
* **Failure:** An HTTP 404 Not Found if the code doesn't exist; an HTTP 400 Bad Request if validation fails (e.g., name too long).

**Input Data (Search/Filter):**

* `code` (string, from URL path for GetByCode).
* No input for GetAll (can be extended with query parameters for filtering).

**Output Data (Search/Filter):**

* **GetByCode Success:** A `QualificationDto` and HTTP 200 OK.
* **GetByCode Failure:** HTTP 404 Not Found.
* **GetAll Success:** A list of `QualificationDto` objects and HTTP 200 OK.

### 1.6. System Sequence Diagram (SSD)

The following SSD illustrates the main interactions: creating, updating, and retrieving qualifications.

![System Sequence Diagram](svg/US2.2.13-system-sequence-diagram.svg)
*(Diagram generated from [us2.2.13-ssd.puml](puml/US2.2.13-system-sequence-diagram.puml))*