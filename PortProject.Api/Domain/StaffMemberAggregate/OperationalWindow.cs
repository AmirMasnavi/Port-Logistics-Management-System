using System.ComponentModel.DataAnnotations;

namespace PortProject.Api.Domain.StaffMemberAggregate
{
    // Value Object for Operational Window
    public record OperationalWindow
    {
        [Required]
        public TimeOnly StartTime { get; }

        [Required]
        public TimeOnly EndTime { get; }

        public IReadOnlyCollection<DayOfWeek> WorkingDays { get; }

        public OperationalWindow(TimeOnly startTime, TimeOnly endTime, IEnumerable<DayOfWeek>? workingDays = null)
        {
            if (startTime >= endTime)
                throw new ArgumentException("Start time must be before end time.");

            StartTime = startTime;
            EndTime = endTime;
            
            // Default to Monday-Friday if no working days specified
            WorkingDays = workingDays?.ToList() ?? 
                         new List<DayOfWeek> 
                         { 
                             DayOfWeek.Monday, 
                             DayOfWeek.Tuesday, 
                             DayOfWeek.Wednesday, 
                             DayOfWeek.Thursday, 
                             DayOfWeek.Friday 
                         };
        }

        public bool IsWithinWindow(DateTime dateTime)
        {
            var dayOfWeek = dateTime.DayOfWeek;
            if (!WorkingDays.Contains(dayOfWeek))
                return false;

            var timeOnly = TimeOnly.FromDateTime(dateTime);
            return timeOnly >= StartTime && timeOnly <= EndTime;
        }

        public override string ToString()
        {
            var days = string.Join(", ", WorkingDays.Select(d => d.ToString()));
            return $"{StartTime:HH:mm} - {EndTime:HH:mm} on {days}";
        }
    }
}
