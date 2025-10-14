using src.Domain.Shared;

namespace PortProject.Api.Domain.DockAggregate
{
    public class DockId : EntityId
    {
        // Construtor protegido para EF
        protected DockId() : base("") { }

        public DockId(string value) : base(value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("O identificador do cais não pode ser nulo ou vazio.", nameof(value));
        }

        public static DockId New(string value) => new DockId(value.Trim());

        // Devolver apenas a string normalizada (sem criar nova instância)
        protected override object createFromString(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                throw new ArgumentException("O identificador do cais não pode ser nulo ou vazio.", nameof(text));
            return text.Trim();
        }

        public override string AsString() => Value;
        public override string ToString() => Value;
    }
}