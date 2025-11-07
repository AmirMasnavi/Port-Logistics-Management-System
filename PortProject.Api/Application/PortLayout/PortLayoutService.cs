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
            "layout2" => JsonSerializer.Serialize(GetLayout2(), options),
            _ => JsonSerializer.Serialize(GetLayout1(), options), // Layout 1 por defeito
        };
    }

    // Small concrete type to represent layout elements (avoid anonymous-array typing issues)
    private record LayoutElement(string Type, string Id, string? Name, double[] Position, double[] Size);

    // Layout 1: Porto mais simples com 3 docas e 1 pátio.
    private object GetLayout1()
    {
        var elements = new LayoutElement[]
        {
            // Elementos estáticos do cenário
            new LayoutElement("water", "water_main", null, new double[] { 0, -0.1, 0 }, new double[] { 50, 0.1, 50 }),
            new LayoutElement("land", "land_left", null, new double[] { -15, -0.05, 0 }, new double[] { 20, 0.1, 50 }),
            new LayoutElement("building", "building_admin", null, new double[] { -20, 2, 0 }, new double[] { 5, 4, 10 }),

            // Elementos operacionais (onde os navios e gruas podem ser associados)
            new LayoutElement("dock", "Dock A", "Dock A", new double[] { -6, 0, 15 }, new double[] { 2, 0.2, 10 }),
            new LayoutElement("dock", "Dock B", "Dock B", new double[] { -6, 0, 0 }, new double[] { 2, 0.2, 12 }),
            new LayoutElement("dock", "Dock C", "Dock C", new double[] { -6, 0, -15 }, new double[] { 2, 0.2, 10 }),
            new LayoutElement("yard", "Yard A", "Yard A", new double[] { -15, 0, 0 }, new double[] { 10, 0.1, 40 }),
        };

        return new { elements };
    }

    // Layout 2: Porto mais complexo com 5 docas e 2 pátios.
    private object GetLayout2()
    {
        var elements = new LayoutElement[]
        {
            new LayoutElement("water", "water_main", null, new double[] { 0, -0.1, 0 }, new double[] { 60, 0.1, 60 }),
            new LayoutElement("land", "land_left", null, new double[] { -15, -0.05, 0 }, new double[] { 20, 0.1, 60 }),
            new LayoutElement("land", "land_right", null, new double[] { 15, -0.05, 0 }, new double[] { 20, 0.1, 60 }),
            new LayoutElement("building", "building_main", null, new double[] { -20, 2.5, -20 }, new double[] { 8, 5, 15 }),

            // Docas à esquerda
            new LayoutElement("dock", "Dock A", "Dock A", new double[] { -6, 0, 20 }, new double[] { 2, 0.2, 10 }),
            new LayoutElement("dock", "Dock B", "Dock B", new double[] { -6, 0, 5 }, new double[] { 2, 0.2, 12 }),
            new LayoutElement("dock", "Dock C", "Dock C", new double[] { -6, 0, -10 }, new double[] { 2, 0.2, 10 }),
                
            // Docas à direita
            new LayoutElement("dock", "Dock D", "Dock D", new double[] { 6, 0, 15 }, new double[] { 2, 0.2, 15 }),
            new LayoutElement("dock", "Dock E", "Dock E", new double[] { 6, 0, -10 }, new double[] { 2, 0.2, 15 }),
                
            // Pátios (Yards)
            new LayoutElement("yard", "Yard A", "Yard A", new double[] { -15, 0, 10 }, new double[] { 10, 0.1, 40 }),
            new LayoutElement("yard", "Yard B", "Yard B", new double[] { 15, 0, 0 }, new double[] { 12, 0.1, 50 }),
        };

        return new { elements };
    }
}