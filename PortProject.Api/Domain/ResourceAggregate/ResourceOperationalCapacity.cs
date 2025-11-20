﻿namespace PortProject.Api.Domain.ResourceAggregate;
    
    public class ResourceOperationalCapacity
    {
        public ResourceKind Kind { get; private set; }
    
        // Crane
        public int? AverageContainersPerHour { get; private set; }
    
        // Truck
        public int? ContainersPerTrip { get; private set; }
        public double? AverageSpeedKmh { get; private set; }
    
        // Other (genérico)
        public string? Unit { get; private set; }
        public double? GenericValue { get; private set; }
    
        // For EF Core - must be public for EF to materialize owned types
        public ResourceOperationalCapacity() { }
    
        private ResourceOperationalCapacity(
            ResourceKind kind,
            int? averageContainersPerHour,
            int? containersPerTrip,
            double? averageSpeedKmh,
            string? unit,
            double? genericValue)
        {
            Kind = kind;
    
            AverageContainersPerHour = averageContainersPerHour;
            ContainersPerTrip = containersPerTrip;
            AverageSpeedKmh = averageSpeedKmh;
            Unit = unit;
            GenericValue = genericValue;
    
            Validate();
        }
    
        public static ResourceOperationalCapacity ForCrane(int averageContainersPerHour)
        {
            if (averageContainersPerHour <= 0) throw new ArgumentOutOfRangeException(nameof(averageContainersPerHour));
            return new ResourceOperationalCapacity(ResourceKind.Crane, averageContainersPerHour, null, null, null, null);
        }
    
        public static ResourceOperationalCapacity ForTruck(int containersPerTrip, double averageSpeedKmh)
        {
            if (containersPerTrip <= 0) throw new ArgumentOutOfRangeException(nameof(containersPerTrip));
            if (averageSpeedKmh <= 0) throw new ArgumentOutOfRangeException(nameof(averageSpeedKmh));
            return new ResourceOperationalCapacity(ResourceKind.Truck, null, containersPerTrip, averageSpeedKmh, null, null);
        }
    
        public static ResourceOperationalCapacity ForOther(string unit, double value)
        {
            if (string.IsNullOrWhiteSpace(unit)) throw new ArgumentException("Unit is required.", nameof(unit));
            if (value <= 0) throw new ArgumentOutOfRangeException(nameof(value));
            return new ResourceOperationalCapacity(ResourceKind.Other, null, null, null, unit, value);
        }
    
        private void Validate()
        {
            switch (Kind)
            {
                case ResourceKind.Crane:
                    if (AverageContainersPerHour is null)
                        throw new InvalidOperationException("Crane capacity requires AverageContainersPerHour.");
                    break;
                case ResourceKind.Truck:
                    if (ContainersPerTrip is null || AverageSpeedKmh is null)
                        throw new InvalidOperationException("Truck capacity requires ContainersPerTrip and AverageSpeedKmh.");
                    break;
                case ResourceKind.Other:
                    if (string.IsNullOrWhiteSpace(Unit) || GenericValue is null)
                        throw new InvalidOperationException("Other capacity requires Unit and GenericValue.");
                    break;
            }
        }
    
        public override string ToString()
        {
            return Kind switch
            {
                ResourceKind.Crane => $"Crane: {AverageContainersPerHour} avg containers/hour",
                ResourceKind.Truck => $"Truck: {ContainersPerTrip} containers/trip @ {AverageSpeedKmh} km/h",
                _ => $"Other: {GenericValue} {Unit}"
            };
        }
    }