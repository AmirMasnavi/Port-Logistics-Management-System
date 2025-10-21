using PortProject.Api.Models;
using PortProject.Api.Domain.VesselTypeAggregate;
using src.Domain.VesselTypeAggregate;

namespace PortProject.Api.IntegrationTests.Helpers
{
    /// <summary>
    /// Classe utilitária para inicializar e gerenciar dados de teste para VesselType.
    /// </summary>
    public static class VesselTypeUtilities
    {
        /// <summary>
        /// Inicializa a base de dados com dados de seed para testes.
        /// </summary>
        /// <param name="db">Contexto da base de dados</param>
        public static void InitializeDbForTests(PortProjectContext db)
        {
            db.VesselTypes.AddRange((IEnumerable<VesselType>)GetSeedingVesselTypesData());
            db.SaveChanges();
        }

        /// <summary>
        /// Reinicializa a base de dados, removendo todos os VesselTypes existentes
        /// e adicionando os dados de seed novamente.
        /// </summary>
        /// <param name="db">Contexto da base de dados</param>
        public static void ReinitializeDbForTests(PortProjectContext db)
        {
            db.VesselTypes.RemoveRange(db.VesselTypes);
            db.SaveChanges();
            InitializeDbForTests(db);
        }

        /// <summary>
        /// Retorna uma lista de VesselTypes para seeding da base de dados.
        /// Contém 3 tipos de embarcações pré-configuradas para testes.
        /// </summary>
        /// <returns>Lista de VesselType para testes</returns>
        public static List<VesselType> GetSeedingVesselTypesData()
        {
            return new List<VesselType>()
            {
                VesselType.Create(
                    id: "1001",
                    name: "Container Ship",
                    description: "Large vessel designed for container transport across oceans",
                    capacity: 5000,
                    rows: 10,
                    bays: 20,
                    tiers: 8
                ),
                VesselType.Create(
                    id: "1002",
                    name: "Bulk Carrier",
                    description: "Vessel specialized in transporting bulk cargo such as grains and coal",
                    capacity: 8000,
                    rows: 12,
                    bays: 25,
                    tiers: 10
                ),
                VesselType.Create(
                    id: "1003",
                    name: "Tanker",
                    description: "Oil and liquid cargo vessel with specialized tanks",
                    capacity: 3000,
                    rows: 8,
                    bays: 15,
                    tiers: 6
                ),
                VesselType.Create(
                    id: "1004",
                    name: "Ro-Ro Carrier",
                    description: "Roll-on/Roll-off vessel for vehicles and wheeled cargo",
                    capacity: 2500,
                    rows: 6,
                    bays: 12,
                    tiers: 5
                )
            };
        }

        /// <summary>
        /// Retorna dados mínimos para criar um VesselType válido em testes.
        /// Útil para testes que precisam de um VesselType simples.
        /// </summary>
        /// <returns>VesselType com configuração mínima</returns>
        public static VesselType GetMinimalVesselType()
        {
            return VesselType.Create(
                id: "9999",
                name: "Test Vessel",
                description: "Minimal vessel type for testing",
                capacity: 1000,
                rows: 5,
                bays: 10,
                tiers: 4
            );
        }

        /// <summary>
        /// Limpa todos os VesselTypes da base de dados.
        /// Útil para preparar testes isolados.
        /// </summary>
        /// <param name="db">Contexto da base de dados</param>
        public static void CleanDatabase(PortProjectContext db)
        {
            db.VesselTypes.RemoveRange(db.VesselTypes);
            db.SaveChanges();
        }

        /// <summary>
        /// Verifica se um VesselType com o ID especificado existe na base de dados.
        /// </summary>
        /// <param name="db">Contexto da base de dados</param>
        /// <param name="id">ID do VesselType a verificar</param>
        /// <returns>True se existe, False caso contrário</returns>
        public static bool VesselTypeExists(PortProjectContext db, string id)
        {
            return db.VesselTypes.Any(vt => vt.Id.Value == id);
        }

        /// <summary>
        /// Retorna o número total de VesselTypes na base de dados.
        /// </summary>
        /// <param name="db">Contexto da base de dados</param>
        /// <returns>Contagem de VesselTypes</returns>
        public static int GetVesselTypeCount(PortProjectContext db)
        {
            return db.VesselTypes.Count();
        }
    }
}