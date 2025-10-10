namespace PortProject.Api.Domain.VesselAggregate
{
    /// <summary>
    /// Data Transfer Object for transferring vessel information.
    /// </summary>
    public class VesselDto
    {
        /// <summary>
        /// IMO number — primary identifier of the vessel (7 digits with check digit).
        /// </summary>
        public string ImoNumber { get; set; } = default!;

        /// <summary>
        /// Vessel name.
        /// </summary>
        public string Name { get; set; } = default!;

        /// <summary>
        /// Identifier of the vessel type associated with this vessel.
        /// </summary>
        public string VesselTypeId { get; set; } = default!;

        /// <summary>
        /// Operator or owner of the vessel.
        /// </summary>
        public string Operator { get; set; } = default!;
    }

    /// <summary>
    /// DTO used when creating or updating a vessel record.
    /// </summary>
    public class VesselCreateDto
    {
        /// <summary>
        /// IMO number of the vessel (must be valid format).
        /// </summary>
        public string ImoNumber { get; set; } = default!;

        /// <summary>
        /// Name of the vessel.
        /// </summary>
        public string Name { get; set; } = default!;

        /// <summary>
        /// Type of the vessel (foreign key to VesselType entity).
        /// </summary>
        public string VesselTypeId { get; set; } = default!;

        /// <summary>
        /// Operator or owner of the vessel.
        /// </summary>
        public string Operator { get; set; } = default!;
    }
}