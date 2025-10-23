using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using PortProject.Api.Domain.ShippingAgentOrganizationAggregate;

namespace PortProject.Api.Tests.Domain.ShippingAgentRepresentativeAggregate
{
    [TestClass]
    public class ShippingAgentRepresentativeTests
    {
        // ---------- Helpers válidos ----------
        private static CitizenId ValidCitizenId() => new CitizenId("12345678Z");            // CC: 8 dígitos + letra
        private static RepresentativeName ValidName() => new RepresentativeName("Ana Silva");
        private static RepresentativePhone ValidPhone() => new RepresentativePhone("912345678"); // começa por 9 + 9 dígitos
        private static RepresentativeNationality ValidNationality() => new RepresentativeNationality("PT");
        private static RepresentativeEmail ValidEmail() => new RepresentativeEmail("ana.silva@example.com");

        // Ajusta esta factory se OrganizationId tiver outra API (ex.: OrganizationId.NewId())
        private static OrganizationId NewOrganizationId()
        {
            // Muitos dos vossos erros anteriores foram "Unrecognized Guid format".
            // Gera sempre um GUID válido.
            return OrganizationId.NewId();
        }

        // ---------- Construtor ----------
        [TestMethod]
        public void Ctor_WithValidArgs_ShouldCreateWithNewId_AndNullOrganization()
        {
            // Act
            var rep = new ShippingAgentRepresentative(
                ValidCitizenId(),
                ValidName(),
                ValidPhone(),
                ValidNationality(),
                ValidEmail()
            );

            // Assert
            Assert.IsNotNull(rep.RepresentativeId, "RepresentativeId deve ser gerado.");
            Assert.IsNull(rep.OrganizationId, "OrganizationId deve ser nulo até ser associado via AttachToOrganization.");
            Assert.AreEqual("12345678Z", rep.CitizenId.Value);
            Assert.AreEqual("Ana Silva", rep.RepresentativeName.Value);
            Assert.AreEqual("912345678", rep.RepresentativePhone.Value);
            Assert.AreEqual("PT", rep.RepresentativeNationality.Value);
            Assert.AreEqual("ana.silva@example.com", rep.RepresentativeEmail.Value);
        }

        [TestMethod]
        public void Ctor_WithNullCitizenId_ShouldThrow()
        {
            Assert.ThrowsException<ArgumentNullException>(() =>
                new ShippingAgentRepresentative(
                    null!,
                    ValidName(),
                    ValidPhone(),
                    ValidNationality(),
                    ValidEmail()
                ));
        }

        [TestMethod]
        public void Ctor_WithNullName_ShouldThrow()
        {
            Assert.ThrowsException<ArgumentNullException>(() =>
                new ShippingAgentRepresentative(
                    ValidCitizenId(),
                    null!,
                    ValidPhone(),
                    ValidNationality(),
                    ValidEmail()
                ));
        }

        [TestMethod]
        public void Ctor_WithNullPhone_ShouldThrow()
        {
            Assert.ThrowsException<ArgumentNullException>(() =>
                new ShippingAgentRepresentative(
                    ValidCitizenId(),
                    ValidName(),
                    null!,
                    ValidNationality(),
                    ValidEmail()
                ));
        }

        [TestMethod]
        public void Ctor_WithNullNationality_ShouldThrow()
        {
            Assert.ThrowsException<ArgumentNullException>(() =>
                new ShippingAgentRepresentative(
                    ValidCitizenId(),
                    ValidName(),
                    ValidPhone(),
                    null!,
                    ValidEmail()
                ));
        }

        [TestMethod]
        public void Ctor_WithNullEmail_ShouldThrow()
        {
            Assert.ThrowsException<ArgumentNullException>(() =>
                new ShippingAgentRepresentative(
                    ValidCitizenId(),
                    ValidName(),
                    ValidPhone(),
                    ValidNationality(),
                    null!
                ));
        }

        // ---------- AttachToOrganization ----------
        [TestMethod]
        public void AttachToOrganization_WithValidId_ShouldSetOrganizationId()
        {
            var rep = new ShippingAgentRepresentative(
                ValidCitizenId(),
                ValidName(),
                ValidPhone(),
                ValidNationality(),
                ValidEmail()
            );
            var orgId = NewOrganizationId();

            rep.AttachToOrganization(orgId);

            Assert.IsNotNull(rep.OrganizationId, "OrganizationId deve ser definido após AttachToOrganization.");
            Assert.AreEqual(orgId, rep.OrganizationId);
        }

        [TestMethod]
        public void AttachToOrganization_WithNullId_ShouldThrow()
        {
            var rep = new ShippingAgentRepresentative(
                ValidCitizenId(),
                ValidName(),
                ValidPhone(),
                ValidNationality(),
                ValidEmail()
            );

            Assert.ThrowsException<ArgumentNullException>(() => rep.AttachToOrganization(null!));
        }

        // ---------- UpdateDetails ----------
        [TestMethod]
        public void UpdateDetails_WithValidValues_ShouldReplaceAllValueObjects_KeepSameRepresentativeId()
        {
            var rep = new ShippingAgentRepresentative(
                ValidCitizenId(),
                ValidName(),
                ValidPhone(),
                ValidNationality(),
                ValidEmail()
            );
            var originalRepId = rep.RepresentativeId;

            // novos dados válidos
            var newCitizenId = new CitizenId("87654321K");
            var newName = new RepresentativeName("Beatriz Costa");
            var newPhone = new RepresentativePhone("934567890");
            var newNationality = new RepresentativeNationality("ES");
            var newEmail = new RepresentativeEmail("beatriz.costa@example.org");

            rep.UpdateDetails(newCitizenId, newName, newPhone, newNationality, newEmail);

            Assert.AreEqual(originalRepId, rep.RepresentativeId, "RepresentativeId não deve mudar no update.");
            Assert.AreEqual("87654321K", rep.CitizenId.Value);
            Assert.AreEqual("Beatriz Costa", rep.RepresentativeName.Value);
            Assert.AreEqual("934567890", rep.RepresentativePhone.Value);
            Assert.AreEqual("ES", rep.RepresentativeNationality.Value);
            Assert.AreEqual("beatriz.costa@example.org", rep.RepresentativeEmail.Value);
        }

        [TestMethod]
        public void UpdateDetails_WithNullCitizenId_ShouldThrow()
        {
            var rep = new ShippingAgentRepresentative(
                ValidCitizenId(),
                ValidName(),
                ValidPhone(),
                ValidNationality(),
                ValidEmail()
            );
            Assert.ThrowsException<ArgumentNullException>(() =>
                rep.UpdateDetails(null!, ValidName(), ValidPhone(), ValidNationality(), ValidEmail()));
        }

        [TestMethod]
        public void UpdateDetails_WithNullName_ShouldThrow()
        {
            var rep = new ShippingAgentRepresentative(
                ValidCitizenId(),
                ValidName(),
                ValidPhone(),
                ValidNationality(),
                ValidEmail()
            );
            Assert.ThrowsException<ArgumentNullException>(() =>
                rep.UpdateDetails(ValidCitizenId(), null!, ValidPhone(), ValidNationality(), ValidEmail()));
        }

        [TestMethod]
        public void UpdateDetails_WithNullPhone_ShouldThrow()
        {
            var rep = new ShippingAgentRepresentative(
                ValidCitizenId(),
                ValidName(),
                ValidPhone(),
                ValidNationality(),
                ValidEmail()
            );
            Assert.ThrowsException<ArgumentNullException>(() =>
                rep.UpdateDetails(ValidCitizenId(), ValidName(), null!, ValidNationality(), ValidEmail()));
        }

        [TestMethod]
        public void UpdateDetails_WithNullNationality_ShouldThrow()
        {
            var rep = new ShippingAgentRepresentative(
                ValidCitizenId(),
                ValidName(),
                ValidPhone(),
                ValidNationality(),
                ValidEmail()
            );
            Assert.ThrowsException<ArgumentNullException>(() =>
                rep.UpdateDetails(ValidCitizenId(), ValidName(), ValidPhone(), null!, ValidEmail()));
        }

        [TestMethod]
        public void UpdateDetails_WithNullEmail_ShouldThrow()
        {
            var rep = new ShippingAgentRepresentative(
                ValidCitizenId(),
                ValidName(),
                ValidPhone(),
                ValidNationality(),
                ValidEmail()
            );
            Assert.ThrowsException<ArgumentNullException>(() =>
                rep.UpdateDetails(ValidCitizenId(), ValidName(), ValidPhone(), ValidNationality(), null!));
        }

        // ---------- Regras de integridade (extra útil) ----------
        [TestMethod]
        public void AttachThenUpdate_ShouldPreserveOrganizationId()
        {
            var rep = new ShippingAgentRepresentative(
                ValidCitizenId(),
                ValidName(),
                ValidPhone(),
                ValidNationality(),
                ValidEmail()
            );
            var orgId = NewOrganizationId();
            rep.AttachToOrganization(orgId);

            rep.UpdateDetails(
                new CitizenId("11112222A"),
                new RepresentativeName("Novo Nome"),
                new RepresentativePhone("923456789"),
                new RepresentativeNationality("FR"),
                new RepresentativeEmail("novo.nome@exemplo.com")
            );

            Assert.AreEqual(orgId, rep.OrganizationId, "OrganizationId não deve ser alterado pelo UpdateDetails.");
        }
    }
}
