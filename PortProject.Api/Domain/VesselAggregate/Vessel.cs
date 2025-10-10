using System;
using System.ComponentModel.DataAnnotations;
using PortProject.Api.Domain.VesselTypeAggregate;
using src.Domain.VesselTypeAggregate;

namespace PortProject.Api.Domain.VesselAggregate
{
    /// <summary>
    /// Aggregate Root representing a registered vessel.
    /// </summary>
    public class Vessel
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

        // Construtor protegido para EF Core
        protected Vessel()
        {
            ImoNumber = null!;
            Name = string.Empty;
            VesselTypeId = null!;
            Operator = null!;
        }

        public Vessel(ImoNumber imoNumber, string name, VesselTypeId vesselTypeId, VesselOperator vesselOperator)
        {
            ImoNumber = imoNumber ?? throw new ArgumentNullException(nameof(imoNumber));

            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Vessel name cannot be null or empty.", nameof(name));

            Name = name.Trim();
            VesselTypeId = vesselTypeId ?? throw new ArgumentNullException(nameof(vesselTypeId));
            Operator = vesselOperator ?? throw new ArgumentNullException(nameof(vesselOperator));

            CreatedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        // --- Métodos de atualização ---

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

        public override string ToString()
        {
            return $"{Name} (IMO {ImoNumber}) - Operator: {Operator}";
        }
    }
}
