using System.Text.Json;

namespace PortProject.Api.Application.PortLayout;

public interface IPortLayoutService
{
    string GetLayout(string layoutId);
}

public class PortLayoutService : IPortLayoutService
{
    public string GetLayout(string layoutId)
    {
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        };
        
        return layoutId.ToLower() switch
        {
            _ => JsonSerializer.Serialize(GetRealisticLayout(), options),
        };
    }
    
    private record LayoutElement(string Type, string Id, string? Name, double[] Position, double[] Size);

    /// <summary>
    /// This method defines a more complex port layout based on the provided image.
    /// It features a main pier extending into the water with surrounding land and facilities.
    /// The land elements have been elevated to create a clear height difference from the water level.
    /// </summary>
    private object GetRealisticLayout()
    {
        // Define a base height for the port ground level
        const double portGroundY = 1.0;
        const double portGroundHeight = 6.0;

        var elements = new LayoutElement[]
        {
            // --- Base Layers (Water and Land) ---
            // Water remains at a low Y-level
            new LayoutElement("water", "main_water", null, new double[] { 0, -0.1, 0 }, new double[] { 250, 0.1, 200 }),
            
            // Inland area is elevated
            new LayoutElement("land", "inland_area", null, new double[] { 0, portGroundY, -110 }, new double[] { 250, portGroundHeight, 100 }),

            // --- Main Pier Structure (Elevated) ---
            // Increase the length (X dimension) of the middle land (main pier land)
            new LayoutElement("land", "main_pier_land", "Main Pier", new double[] { 0, portGroundY, 0 }, new double[] { 80, portGroundHeight, 120 }),
            new LayoutElement("yard", "container_yard_1", "Container Yard", new double[] { 0, portGroundY + (portGroundHeight / 2) + 0.05, 0 }, new double[] { 55, 0.1, 115 }),
            
            // --- Docks on either side of the pier (Elevated) ---
            // Set docks to half of their current length
            new LayoutElement("dock", "Dock A", "Dock A", new double[] { -31, portGroundY, 0 }, new double[] { 1, portGroundHeight, 90 }),
            new LayoutElement("dock", "Dock B", "Dock B", new double[] { 31, portGroundY, 0 }, new double[] { 0.5, portGroundHeight, 90 }),

            // --- Inland Facilities (Elevated to sit on the new ground level) ---
            new LayoutElement("yard", "bulk_storage_yard", "Bulk Yard", new double[] { -90, portGroundY + (portGroundHeight / 2) + 0.05, -100 }, new double[] { 60, 0.1, 50 }),
            new LayoutElement("building", "admin_building", "Admin Building", new double[] { -100, portGroundY + (portGroundHeight / 2) + 2, -130 }, new double[] { 15, 4, 20 }),
            new LayoutElement("building", "main_warehouse", "Warehouse 1", new double[] { 40, portGroundY + (portGroundHeight / 2) + 3, -115 }, new double[] { 50, 6, 25 }),
            new LayoutElement("building", "silo_tanks", "Storage Tanks", new double[] { 100, portGroundY + (portGroundHeight / 2) + 8, -120 }, new double[] { 12, 16, 12 }),
        };

        return new { elements };
    }
}