using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PortProject.Api.Domain.VesselAggregate;
using PortProject.Api.Models;
using src.Domain.VesselTypeAggregate;

namespace src.Infrastructure.VesselAggregate
{
    public class VesselRepository : IVesselRepository
    {
        private readonly PortProjectContext _context;
        private readonly DbSet<Vessel> _set;

        public VesselRepository(PortProjectContext context)
        {
            _context = context;
            _set = context.Vessels;
        }

        public async Task<Vessel?> GetByImoAsync(ImoNumber imoNumber)
        {
            if (imoNumber == null) throw new ArgumentNullException(nameof(imoNumber));

            return await _set.AsNoTracking()
                .FirstOrDefaultAsync(v => v.ImoNumber == imoNumber);
        }

        public async Task<IEnumerable<Vessel>> SearchByCriteriaAsync(string? imo = null, string? name = null, string? operatorName = null)
        {
            IQueryable<Vessel> query = _set.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(imo))
            {
                var imoObject = new ImoNumber(imo.Trim()); 
                query = query.Where(v => v.ImoNumber == imoObject); 
            }

            if (!string.IsNullOrWhiteSpace(name))
                query = query.Where(v => v.Name.ToLower().Contains(name.Trim().ToLower()));

            if (!string.IsNullOrWhiteSpace(operatorName))
                query = query.Where(v => v.Operator.Value.ToLower().Contains(operatorName.Trim().ToLower()));

            return await query.ToListAsync();
        }

        public async Task AddAsync(Vessel vessel)
        {
            if (vessel == null) throw new ArgumentNullException(nameof(vessel));
            await _set.AddAsync(vessel);
            await _context.SaveChangesAsync();
        }

        public async Task<Vessel> UpdateAsync(Vessel vessel)
        {
            if (vessel == null) throw new ArgumentNullException(nameof(vessel));

            _context.Entry(vessel).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return vessel;
        }

        public async Task DeleteAsync(Vessel vessel)
        {
            if (vessel == null) throw new ArgumentNullException(nameof(vessel));

            _set.Remove(vessel);
            await _context.SaveChangesAsync();
        }
    }
}
