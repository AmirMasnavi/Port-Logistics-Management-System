using System.ComponentModel.DataAnnotations;
using PortProject.Api.Domain.QualificationAggregate;

namespace PortProject.Api.Domain.StaffMemberAggregate
{
    // This is the Aggregate Root
    public class StaffMember
    {
        public MecanographicNumber MecanographicNumber { get; private set; }
        public string ShortName { get; private set; }
        public ContactDetails ContactDetails { get; private set; }

        // Private list to hold the IDs
        private readonly List<QualificationCode> _qualifications = new();
        // Publicly expose a read-only view of the list
        public IReadOnlyCollection<QualificationCode> Qualifications => _qualifications.AsReadOnly();
        
        public OperationalWindow OperationalWindow { get; private set; }
        public StaffStatus CurrentStatus { get; private set; }

        public DateTime CreatedAt { get; private set; }
        public DateTime UpdatedAt { get; private set; }

        // Constructor for Entity Framework
        protected StaffMember()
        {
            MecanographicNumber = null!;
            ShortName = string.Empty;
            ContactDetails = null!;
            OperationalWindow = null!;
        }

        public StaffMember(MecanographicNumber mecanographicNumber, string shortName, ContactDetails contactDetails, 
                           OperationalWindow operationalWindow, List<QualificationCode>? initialQualifications = null)
        {
            MecanographicNumber = mecanographicNumber ?? throw new ArgumentNullException(nameof(mecanographicNumber));
            
            if (string.IsNullOrWhiteSpace(shortName))
                throw new ArgumentException("Short name cannot be null or empty.", nameof(shortName));

            ShortName = shortName;
            ContactDetails = contactDetails ?? throw new ArgumentNullException(nameof(contactDetails));
            OperationalWindow = operationalWindow ?? throw new ArgumentNullException(nameof(operationalWindow));
            
            if (initialQualifications != null && initialQualifications.Count > 0)
            {
                _qualifications.AddRange(initialQualifications);
            }

            CurrentStatus = StaffStatus.Available; // Default status on creation
            CreatedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }
        
        // --- Methods to Mutate State ---

        public void ChangeShortName(string newShortName)
        {
            if (string.IsNullOrWhiteSpace(newShortName))
                throw new ArgumentException("Short name cannot be null or empty.", nameof(newShortName));
            
            ShortName = newShortName;
            UpdatedAt = DateTime.UtcNow;
        }

        public void UpdateContactDetails(ContactDetails newContactDetails)
        {
            ContactDetails = newContactDetails ?? throw new ArgumentNullException(nameof(newContactDetails));
            UpdatedAt = DateTime.UtcNow;
        }

        public void AddQualification(QualificationCode qualificationCode)
        {
            if (!_qualifications.Contains(qualificationCode))
            {
                _qualifications.Add(qualificationCode);
                UpdatedAt = DateTime.UtcNow;
            }
        }

        public void RemoveQualification(QualificationCode qualificationCode)
        {
            if (_qualifications.Remove(qualificationCode))
            {
                UpdatedAt = DateTime.UtcNow;
            }
        }

        public void UpdateOperationalWindow(OperationalWindow newOperationalWindow)
        {
            OperationalWindow = newOperationalWindow ?? throw new ArgumentNullException(nameof(newOperationalWindow));
            UpdatedAt = DateTime.UtcNow;
        }

        public void UpdateStatus(StaffStatus newStatus)
        {
            // You could add logic here, e.g., cannot change status if OnLeave, etc.
            CurrentStatus = newStatus;
            UpdatedAt = DateTime.UtcNow;
        }

        // --- Business Logic / Queries ---

        public bool IsAvailableAt(DateTime dateTime)
        {
            if (CurrentStatus != StaffStatus.Available)
                return false;

            return OperationalWindow.IsWithinWindow(dateTime);
        }

        public override string ToString()
        {
            return $"{ShortName} ({MecanographicNumber}) - Status: {CurrentStatus}";
        }
    }
}