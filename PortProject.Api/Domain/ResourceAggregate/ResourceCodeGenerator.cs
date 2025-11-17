using Microsoft.EntityFrameworkCore;
using PortProject.Api.Models;

namespace PortProject.Api.Domain.ResourceAggregate;

public static class ResourceCodeGenerator
{
    private const string Prefix = "res"; // simple prefix for generated resource codes
    private const int PadLength = 3;      // number padding length (res001, res002, ...)

    public static async Task<ResourceCode> GenerateAsync(PortProjectContext context)
    {
        // Fetch existing codes using value conversion; EF will materialize ResourceCode objects.
        var existingCodeObjects = await context.Resources
            .AsNoTracking()
            .Select(r => r.Code)
            .ToListAsync();

        var maxNumber = existingCodeObjects
            .Select(c => c.Value)
            .Where(v => v.StartsWith(Prefix, StringComparison.OrdinalIgnoreCase))
            .Select(v => {
                var numericPart = v.Substring(Prefix.Length);
                return int.TryParse(numericPart, out var n) ? n : 0;
            })
            .DefaultIfEmpty(0)
            .Max();

        var nextNumber = maxNumber + 1;
        var newCode = $"{Prefix}{nextNumber.ToString().PadLeft(PadLength, '0')}"; // e.g. res001
        return new ResourceCode(newCode);
    }
}
