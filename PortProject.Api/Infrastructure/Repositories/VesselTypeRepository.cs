using Microsoft.EntityFrameworkCore;
using src.Domain.VesselTypeAggregate;
using src.Infrastructure.Shared; 
using AppContext = PortProject.Api.Models.PortProjectContext;
using System.Linq;
using System.Threading.Tasks;
using PortProject.Api.Domain.VesselTypeAggregate;


namespace src.Infrastructure.VesselTypeAggregate // Namespace para a implementação do repositório
{
    /// <summary>
    /// Repository for Vessel Types, handling data persistence and retrieval.
    /// </summary>
    public class VesselTypeRepository : BaseRepository<VesselType, VesselTypeId>, IVesselTypeRepository
    {
        /// <summary>
        /// The application database context.
        /// </summary>
        private readonly AppContext context; // Usando 'context' para seguir seu padrão

        /// <summary>
        /// Initializes a new instance of the <see cref="VesselTypeRepository"/> class.
        /// </summary>
        /// <param name="context">The application database context.</param>
        public VesselTypeRepository(AppContext context) : base(context.VesselTypes)
        {
            this.context = context;
        }

        /// <summary>
        /// Retrieves a VesselType by its name asynchronously.
        /// </summary>
        /// <param name="name">The name of the vessel type.</param>
        /// <returns>The VesselType if found, otherwise null.</returns>
        public async Task<VesselType> GetByNameAsync(VesselTypeName name)
        {
            if (name == null || string.IsNullOrWhiteSpace(name.Value))
            {
                throw new ArgumentException("O parâmetro 'name' não pode ser nulo ou vazio.", nameof(name));
            }

            return await context.VesselTypes
                .FirstOrDefaultAsync(vt => vt.Name.Value == name.Value);
        
        }

        /// <summary>
        /// Searches Vessel Types based on a search term in their name or description asynchronously.
        /// </summary>
        /// <param name="searchTerm">The term to search for. Can be null or empty.</param>
        /// <returns>A collection of VesselTypes matching the criteria.</returns>
        public async Task<IEnumerable<VesselType>> SearchByCriteriaAsync(string? searchTerm = null)
        {
            var query = context.VesselTypes.AsQueryable();

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                // Converte para minúsculas para uma busca case-insensitive no banco de dados.
               
                var lowerSearchTerm = searchTerm.ToLower();
                query = query.Where(vt =>
                    vt.Name.Value.ToLower().Contains(lowerSearchTerm) ||
                    vt.Description.Value.ToLower().Contains(lowerSearchTerm));
            }

            return await query.ToListAsync();
        }

        /// <summary>
        /// Updates an existing VesselType in the database asynchronously.
        /// </summary>
        /// <param name="vesselType">The VesselType entity to update.</param>
        /// <returns>The updated VesselType.</returns>
        public async Task<VesselType> UpdateAsync(VesselType vesselType)
        {
            context.Entry(vesselType).State = EntityState.Modified;


            await context.SaveChangesAsync(); 
            return vesselType;
        }

        public Task<IEnumerable<VesselType>> GetAllAsync()
        {
            throw new NotImplementedException();
        }

        public Task DeleteAsync(VesselType entity)
        {
            throw new NotImplementedException();
        }
    }
}