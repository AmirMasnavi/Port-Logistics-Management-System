using System;
       using src.Domain.Shared;
       
       namespace src.Domain.VesselTypeAggregate
       {
           public class VesselTypeId : EntityId
           {
               
               public string Value { get; protected set; }
               // Construtor protegido para EF
               protected VesselTypeId() : base("") { }
       
               public VesselTypeId(string value) : base(value)
               {
                   if (string.IsNullOrWhiteSpace(value))
                       throw new ArgumentException("O identificador não pode ser nulo ou vazio.", nameof(value));
               }
       
               public static VesselTypeId New(string value) => new VesselTypeId(value.Trim());
       
               // IMPORTANTO: devolver apenas a string normalizada (sem criar nova instância)
               protected override object createFromString(string text)
               {
                   if (string.IsNullOrWhiteSpace(text))
                       throw new ArgumentException("O identificador não pode ser nulo ou vazio.", nameof(text));
                   return text.Trim();
               }
       
               public override string AsString() => Value;
               public override string ToString() => Value;
           }
       }