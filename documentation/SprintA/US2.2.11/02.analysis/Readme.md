# US 2.2.11: Manage Staff Members - Analysis Domain Model

This diagram focuses on the **`StaffMember`** aggregate. It is the central entity, responsible for maintaining its own consistency and business rules. The model highlights its attributes, value objects, and its relationship with the `Qualification` aggregate.

![Analysis Domain Model](svg/us2.2.11-domain-model.svg)
*(Diagram generated from [us2.2.11-domain-model.puml](puml/us2.2.11-domain-model.puml))*

## Key Domain Concepts

* **StaffMember**: The Aggregate Root for this context. It ensures that a staff member's data is always valid. It is identified by a `MecanographicNumber`.
* **MecanographicNumber**: A Value Object representing the unique identifier, enforcing its format rules.
* **ContactDetails**: A Value Object that groups the email and phone, ensuring they are treated as a single unit.
* **OperationalWindow**: A Value Object defining the staff member's working schedule.
* **StaffStatus**: An enum that represents the current availability of the staff member. The `deactivate` operation simply transitions this status to `Unavailable`.
* **Qualification**: A separate aggregate. A `StaffMember` holds a list of references (by `QualificationId`) to the qualifications they possess.