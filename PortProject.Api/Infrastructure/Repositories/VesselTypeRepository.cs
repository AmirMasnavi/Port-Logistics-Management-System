
                using System;
                using System.Collections.Generic;
                using System.Linq;
                using System.Threading.Tasks;
                using Microsoft.EntityFrameworkCore;
                using PortProject.Api.Domain.VesselTypeAggregate;
                using PortProject.Api.Models;
                using src.Domain.VesselTypeAggregate;
                
                namespace src.Infrastructure.VesselTypeAggregate
                {
                    public class VesselTypeRepository : IVesselTypeRepository
                    {
                        private readonly PortProjectContext _context;
                        private readonly DbSet<VesselType> _set;
                
                        public VesselTypeRepository(PortProjectContext context)
                        {
                            _context = context;
                            _set = context.VesselTypes;
                        }
                
                        public async Task<VesselType> AddAsync(VesselType entity)
                        {
                            if (entity == null) throw new ArgumentNullException(nameof(entity));
                            await _set.AddAsync(entity);
                            await _context.SaveChangesAsync();
                            return entity;
                        }
                
                        public async Task<VesselType?> GetByIdAsync(VesselTypeId id)
                        {
                            return (await _set.AsNoTracking().ToListAsync()).FirstOrDefault(v => v.Id.Value == id.Value);
                        }
                
                        public async Task<List<VesselType>> GetByIdsAsync(List<VesselTypeId> ids)
                        {
                            if (ids == null || ids.Count == 0) return new List<VesselType>();
                            var idValues = ids.Select(i => i.Value).ToList();
                            return await _set.Where(v => idValues.Contains(v.Id.Value)).ToListAsync();
                        }
                
                        public async Task<VesselType?> GetByNameAsync(VesselTypeName name)
                        {
                            if (name == null || string.IsNullOrWhiteSpace(name.Value))
                                throw new ArgumentException("Nome inválido.", nameof(name));
                
                            return await _set.FirstOrDefaultAsync(v => v.Name.Value == name.Value);
                        }
                
                        public async Task<IEnumerable<VesselType>> SearchByCriteriaAsync(string? searchTerm = null)
                        {
                            IQueryable<VesselType> query = _set;
                
                            if (!string.IsNullOrWhiteSpace(searchTerm))
                            {
                                var lower = searchTerm.ToLower();
                                query = query.Where(v =>
                                    v.Name.Value.ToLower().Contains(lower) ||
                                    (v.Description.Value != null && v.Description.Value.ToLower().Contains(lower)));
                            }
                
                            return await query.ToListAsync();
                        }
                
                        public async Task<List<VesselType>> GetAllAsync()
                        {
                            return await _set.AsNoTracking().ToListAsync();
                        }
                
                        public async Task<VesselType> UpdateAsync(VesselType vesselType)
                        {
                            _context.Entry(vesselType).State = EntityState.Modified;
                            await _context.SaveChangesAsync();
                            return vesselType;
                        }
                
                        // Método exigido pela interface (sincrono)
                        public void Remove(VesselType entity)
                        {
                            if (entity == null) throw new ArgumentNullException(nameof(entity));
                            _set.Remove(entity);
                            _context.SaveChanges(); // síncrono porque a interface pede void
                        }
                
                        // Opcional: versão assíncrona se for útil em outros pontos
                        public async Task DeleteAsync(VesselType entity)
                        {
                            if (entity == null) throw new ArgumentNullException(nameof(entity));
                            _set.Remove(entity);
                            await _context.SaveChangesAsync();
                        }
                    }
                }