# US221 - Add a Customer Representative

## 1. Requirements Engineering

### 1.1. User Story Description

As a CRM Collaborator, I want to register a new representative of a customer, so that this representative can be contacted and use the system (Customer App).

### 1.2. Customer Specifications and Clarifications

**From the specifications document:**

> The customer representative will also be a user of the system (Customer App).  
> There is no need to verify that the representative’s email belongs to the customer’s domain.  
> Many users may have emails outside the company’s domain.
>
> The representative should be associated with an existing customer.  
> The system must ensure that no duplicate representatives (based on email) exist for the same customer.


### 1.3. Acceptance Criteria

* **AC1:** All required fields (name, email, position) must be filled in.
* **AC2:** The email must be in a valid format.
* **AC3:** It should not be possible to add a representative with an email that already exists for the same customer.
* **AC4:** Upon successful creation, a corresponding user account must be created in the system (Customer App).
* **AC5:** The system must confirm the success or failure of the operation to the CRM Collaborator.

### 1.4. Found out Dependencies

* Requires that the customer to whom the representative will be assigned already exists in the system.
* Integration with the User Management module to create the user account.

### 1.5 Input and Output Data

**Input Data:**

* Typed data:
  * Name of the representative
  * Email
  * Position (role within the customer's company)

**Output Data:**

* Confirmation message indicating success or failure:
  * Example: `"Representative added successfully and user account created."`
  * Or: `"Error: A representative with this email already exists for this customer."`

### 1.6. System Sequence Diagram (SSD)

![System Sequence Diagram](svg/us221-system-sequence-diagram.svg)

### 1.7 Other Relevant Remarks

* None