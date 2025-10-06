# US2.2.6 - Register and Manage Shipping Agent Representatives

## 1. Requirements Engineering

### 1.1. User Story Description

As a **Port Authority Officer**, I want to **register, update, and deactivate representatives** of a shipping agent organization,  
so that only **authorized individuals** can interact with the system on behalf of their organization.

### 1.2. Customer Specifications and Clarifications

**From the specifications document:**

> Each representative must be associated with exactly one shipping agent organization.  
> Representatives must include the following information: name, citizen ID, nationality, email, and phone number.  
> Email and phone number are used for system notifications, including approval decisions and authentication processes.  
> Deactivation of a representative does not delete the data, which must be preserved for audit and historical purposes.  
> Only active representatives are allowed to access the system or submit Vessel Visit Notifications.

### 1.3. Acceptance Criteria

* **AC1:** Each representative must have all required fields filled (name, citizen ID, nationality, email, phone).
* **AC2:** The representative must be linked to exactly one existing shipping agent organization.
* **AC3:** The system must validate the format of the email and phone number.
* **AC4:** It must not be possible to register duplicate representatives (based on citizen ID or email) for the same organization.
* **AC5:** When a representative is created, the system automatically grants them the “Shipping Agent Representative” role.
* **AC6:** Deactivating a representative must only mark the record as inactive, not delete it.
* **AC7:** The system must confirm the success or failure of create, update, or deactivate operations to the Port Authority Officer.

### 1.4. Found Out Dependencies

* Requires that the **shipping agent organization** already exists in the system.
* Integration with the **User Management module** for assigning user roles and authentication credentials.
* Integration with the **notification service**, since representatives receive messages about approval or rejection of vessel visits.

### 1.5. Input and Output Data

**Input Data:**

* Typed data:
  * Name
  * Citizen ID
  * Nationality
  * Email
  * Phone number
  * Associated shipping agent organization
  * (When updating) New field values
  * (When deactivating) Optional reason for deactivation

**Output Data:**

* Confirmation message indicating success or failure of the operation.
  * Example: `"Representative registered successfully."`
  * Example: `"Representative updated successfully."`
  * Example: `"Representative deactivated (data preserved for audit)."`
  * Or error messages such as: `"Error: Duplicate citizen ID or email for this organization."`

### 1.6. System Sequence Diagram (SSD)

![System Sequence Diagram](svg/us2.2.6-system-sequence-diagram.svg)

### 1.7 Other Relevant Remarks

* None