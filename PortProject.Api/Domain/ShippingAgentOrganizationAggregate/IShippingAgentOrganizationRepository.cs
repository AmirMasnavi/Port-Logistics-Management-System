using System.Threading;
using System.Threading.Tasks;

namespace PortProject.Api.Domain.ShippingAgentOrganizationAggregate
{
    /// <summary>
    /// Interface de repositório para o agregado ShippingAgentOrganization.
    /// Define as operações permitidas para persistir e obter entidades.
    /// </summary>
    public interface IShippingAgentOrganizationRepository
    {
        /// <summary>
        /// Adiciona uma nova organização ao repositório.
        /// </summary>
        Task AddAsync(ShippingAgentOrganization organization);

        /// <summary>
        /// Verifica se já existe uma organização com o mesmo número fiscal.
        /// </summary>
        Task<bool> ExistsByTaxNumberAsync(TaxNumber taxNumber);

        /// <summary>
        /// Obtém uma organização pelo seu identificador.
        /// </summary>
        Task<ShippingAgentOrganization?> GetByIdAsync(OrganizationId id);

        Task<IEnumerable<ShippingAgentOrganization>> GetAllAsync(CancellationToken ct = default);

    }
}