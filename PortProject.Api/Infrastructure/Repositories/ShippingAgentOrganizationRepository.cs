using Microsoft.EntityFrameworkCore;
using PortProject.Api.Domain.ShippingAgentOrganizationAggregate;
using PortProject.Api.Models;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace PortProject.Api.Infrastructure.Repositories
{
    public class ShippingAgentOrganizationRepository : IShippingAgentOrganizationRepository
    {
        private readonly PortProjectContext _context;

        public ShippingAgentOrganizationRepository(PortProjectContext context)
        {
            _context = context;
        }

        public async Task AddAsync(ShippingAgentOrganization organization, CancellationToken ct = default)
        {
            await _context.Set<ShippingAgentOrganization>().AddAsync(organization, ct);
        }

        public async Task<bool> ExistsByTaxNumberAsync(TaxNumber taxNumber, CancellationToken ct = default)
        {
            return await _context.Set<ShippingAgentOrganization>().AnyAsync(o => o.TaxNumber == taxNumber, ct);
        }

        public async Task<ShippingAgentOrganization?> GetByIdAsync(OrganizationId id, CancellationToken ct = default)
        {
            return await _context.Set<ShippingAgentOrganization>()
                .Include(o => o.Representatives)
                .FirstOrDefaultAsync(o => o.Id == id, ct);
        }

        public async Task<IEnumerable<ShippingAgentOrganization>> GetAllAsync(CancellationToken ct = default)
        {
            return await _context.Set<ShippingAgentOrganization>().ToListAsync(ct);
        }
    }
}
