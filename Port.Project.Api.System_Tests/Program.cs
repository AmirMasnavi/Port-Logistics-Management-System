// Removed top-level statements to avoid declaring `Program` in this test assembly.
// This file intentionally contains a marker type only.

namespace Port.Project.Api.System_Tests
{
    // Marker class — keeps this assembly free of a `Program` type that would conflict
    // with the API project's `Program` class used by WebApplicationFactory<Program>.
    public static class TestAssemblyMarker { }
}
