using src.Domain.Shared;

namespace src.Domain.VesselTypeAggregate
{
    /// <summary>
    /// Representa o identificador único de um VesselType.
    /// </summary>
    public class VesselTypeId : EntityId
    {
        /// <summary>
        /// Construtor privado para evitar criação direta sem validação.
        /// </summary>
        /// <param name="value">O valor do identificador.</param>
        public VesselTypeId(string value) : base(value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                throw new ArgumentException("O identificador não pode ser nulo ou vazio.", nameof(value));
            }
        }

        /// <summary>
        /// Cria uma nova instância de VesselTypeId a partir de uma string.
        /// </summary>
        /// <param name="value">O valor do identificador.</param>
        /// <returns>Uma nova instância de VesselTypeId.</returns>
        public static VesselTypeId CreateFromString(string value)
        {
            return new VesselTypeId(value);
        }

        /// <summary>
        /// Sobrescreve o método ToString para retornar o valor do identificador.
        /// </summary>
        /// <returns>O valor do identificador como string.</returns>
        public override string ToString()
        {
            return Value.ToString();
        }

        protected override object createFromString(string text)
        {
            throw new NotImplementedException();
        }

        public override string AsString()
        {
            throw new NotImplementedException();
        }
    }
}