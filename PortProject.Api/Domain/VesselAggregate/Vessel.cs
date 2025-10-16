using src.Domain.Shared;
using System;
using System.ComponentModel.DataAnnotations;
using src.Domain.VesselTypeAggregate;

namespace PortProject.Api.Domain.VesselAggregate
{
    /// <summary>
    /// Aggregate Root representing a registered vessel.
    /// </summary>
    public class Vessel : IAggregateRoot
    {
        [Key]
        public ImoNumber ImoNumber { get; private set; }

        [Required]
        public string Name { get; private set; }

        [Required]
        public VesselTypeId VesselTypeId { get; private set; }

        [Required]
        public VesselOperator Operator { get; private set; }

        public DateTime CreatedAt { get; private set; }
        public DateTime UpdatedAt { get; private set; }

        // EF Core
        protected Vessel() { }

        public Vessel(ImoNumber imoNumber, string name, VesselTypeId vesselTypeId, VesselOperator vesselOperator)
        {
            if (imoNumber == null) throw new ArgumentNullException(nameof(imoNumber));
            if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Vessel name cannot be null or empty.", nameof(name));
            if (vesselTypeId == null) throw new ArgumentNullException(nameof(vesselTypeId));
            if (vesselOperator == null) throw new ArgumentNullException(nameof(vesselOperator));

            ImoNumber = imoNumber;
            Name = name.Trim();
            VesselTypeId = vesselTypeId;
            Operator = vesselOperator;

            CreatedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        
        public static Vessel Create(string imo, string name, string vesselTypeId, string operatorName)
        {
            var imoNumber = new ImoNumber(imo);
            var vesselType = new VesselTypeId(vesselTypeId);
            var vesselOperator = new VesselOperator(operatorName);

            return new Vessel(imoNumber, name, vesselType, vesselOperator);
        }

    
        public void UpdateName(string newName)
        {
            if (string.IsNullOrWhiteSpace(newName))
                throw new ArgumentException("Vessel name cannot be null or empty.", nameof(newName));

            Name = newName.Trim();
            UpdatedAt = DateTime.UtcNow;
        }

        public void UpdateVesselType(VesselTypeId newType)
        {
            VesselTypeId = newType ?? throw new ArgumentNullException(nameof(newType));
            UpdatedAt = DateTime.UtcNow;
        }

        public void UpdateOperator(VesselOperator newOperator)
        {
            Operator = newOperator ?? throw new ArgumentNullException(nameof(newOperator));
            UpdatedAt = DateTime.UtcNow;
        }

        public override string ToString() =>
            $"{Name} (IMO {ImoNumber}) - Operator: {Operator}";
    }
}
