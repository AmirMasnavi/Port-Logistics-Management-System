# US 2.2.11 - Requirements Engineering

## 1.1. User Story Description

[cite_start]As a Logistics Operator, I want to register and manage operating staff members (create, update, deactivate), so that the system can accurately reflect staff availability and ensure that only qualified personnel are assigned to resources during scheduling. [cite: 86]

## 1.2. Customer Specifications and Clarifications

**From the specifications document:**
> [cite_start]*Operating staff management information is necessary to support realistic scheduling and allocation.* [cite: 242]
> [cite_start]*Each staff member is registered with the qualifications they hold.* [cite: 246]
> [cite_start]*Staff may be marked as available, unavailable (on leave, training), or temporarily reassigned.* [cite: 248]
> [cite_start]*Deactivation/reactivation must not delete staff data but preserve it for audit and historical planning purposes.* [cite: 90]

**From the client clarifications:**
> *(No specific client clarifications were provided for this user story. Assume the specifications document is the primary source of truth.)*

## 1.3. Acceptance Criteria

* [cite_start]Each staff member must have a unique mecanographic number (ID), short name, contact details (email, phone), qualifications, operational window, and current status (e.g., available, unavailable). [cite: 89]
* [cite_start]Deactivation/reactivation must not delete staff data but preserve it for audit and historical planning purposes. [cite: 90]
* [cite_start]Staff members must be searchable and filterable by id, name, status, and qualifications. [cite: 91]

## 1.4. Found out Dependencies

* The `Qualification` entity must exist before it can be assigned to a staff member.
* The user performing this action must be authenticated and have the "Logistics Operator" role.

## 1.5. Input and Output Data

**Input Data (Create):**
* Typed data:
    * Mecanographic Number (string)
    * Short Name (string)
    * Email (string)
    * Phone (string)
    * Operational Window (start time, end time, working days)
    * List of Qualification IDs

**Input Data (Update Status / Deactivate):**
* Typed data:
    * Staff Member ID (Mecanographic Number)
    * New Status (e.g., "Unavailable")

**Output Data:**
* The full data of the created or updated staff member.
* A confirmation message upon success.
* An error message upon failure (e.g., duplicate ID, invalid data).

## 1.6. System Sequence Diagram (SSD)

The following diagram illustrates the fundamental interactions between the actor (Logistics Operator) and the System for managing staff members.

![System Sequence Diagram](svg/us2.2.11-ssd.svg)
*(Diagram generated from [us2.2.11-ssd.puml](puml/us2.2.11-ssd.puml))*