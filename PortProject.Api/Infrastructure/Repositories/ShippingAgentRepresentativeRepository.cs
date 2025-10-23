using Microsoft.EntityFrameworkCore;
using PortProject.Api.Domain.ShippingAgentOrganizationAggregate;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using PortProject.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PortProject.Api.Infrastructure.Repositories
{
    public class ShippingAgentRepresentativeRepository : IShippingAgentRepresentativeRepository
    {
        private readonly PortProjectContext _context;

        public ShippingAgentRepresentativeRepository(PortProjectContext context)
        {
            _context = context;
        }

        public async Task AddAsync(ShippingAgentRepresentative representative)
        {
            await _context.ShippingAgentRepresentatives.AddAsync(representative);
        }

        public async Task<ShippingAgentRepresentative?> GetByIdAsync(RepresentativeId id)
        {
            return await _context.Set<ShippingAgentRepresentative>().FindAsync(id);
        }

        public async Task<IEnumerable<ShippingAgentRepresentative>> GetAllAsync()
        {
            return await _context.Set<ShippingAgentRepresentative>().ToListAsync();
        }

        public async Task<IEnumerable<ShippingAgentRepresentative>> GetByOrganizationIdAsync(OrganizationId organizationId)
        {
            return await _context.ShippingAgentRepresentatives
                .Where(r => r.OrganizationId == organizationId)
                .ToListAsync();
        }

        public async Task UpdateAsync(ShippingAgentRepresentative representative)
        {
            _context.ShippingAgentRepresentatives.Update(representative);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(ShippingAgentRepresentative representative)
        {
            _context.ShippingAgentRepresentatives.Remove(representative);
            await _context.SaveChangesAsync();
        }
    }
}
