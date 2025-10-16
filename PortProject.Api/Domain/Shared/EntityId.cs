using System;

namespace src.Domain.Shared
{
    /// <summary>
    /// Base class for entities.
    /// </summary>
    public abstract class EntityId: IEquatable<EntityId>, IComparable<EntityId>
    {
        protected object ObjValue { get; private set; }

        public string Value 
        { 
            get 
            { 
                if (this.ObjValue.GetType() == typeof(string))
                    return (string)this.ObjValue;
                return AsString();
            }
            // Allow EF Core to materialize this property via the non-public setter
            protected set
            {
                if (value is null)
                    throw new ArgumentNullException(nameof(value));
                this.ObjValue = createFromString(value);
            }
        }

        protected EntityId() { }

        public EntityId(object value)
        {
            if (value.GetType() == typeof(string))
                this.ObjValue = createFromString((string)value);
            else
                this.ObjValue = value;
        }

       
        protected abstract object createFromString(string text);
        
        public abstract string AsString();


        public override bool Equals(object obj)
        {
            if (ReferenceEquals(null, obj)) return false;
            return obj is EntityId other && Equals(other);
        }

        public override int GetHashCode()
        {
            return Value.GetHashCode();
        }

        public bool Equals(EntityId other)
        {
            if (other == null)
                return false;
            if (this.GetType() != other.GetType())
                return false;
            return this.Value == other.Value;
        }

        public int CompareTo(EntityId other){
            if (other == null)
                return -1;
            return this.Value.CompareTo(other.Value);
        }

        public int CompareTo(object obj)
        {
            if (obj == null) return -1;
            if (!(obj is EntityId)) throw new ArgumentException($"Object is not a {nameof(EntityId)}");
            return CompareTo((EntityId)obj);
        }

        public static bool operator ==(EntityId obj1, EntityId obj2)
        {
            if (object.Equals(obj1, null))
            {
                if (object.Equals(obj2, null))
                {
                    return true;
                }
                return false;
            }
            return obj1.Equals(obj2);
        }
        public static bool operator !=(EntityId x, EntityId y) 
        {
            return !(x == y);
        }
    }
   
}