# Migration Guide: .NET to Node.js

## What Changed?

### Technology Stack
- **Before**: ASP.NET Core, C#, Entity Framework Core, MySQL
- **After**: Node.js, Express.js, Mongoose, MongoDB

### Why?
Per project requirements, the OEM module should use Node.js instead of .NET to demonstrate polyglot architecture and technology diversity.

## File Mapping

### Configuration
| .NET | Node.js |
|------|---------|
| `Program.cs` | `src/server.js` |
| `appsettings.json` | `.env` |
| `PortProject.OEM.Api.csproj` | `package.json` |

### Architecture Layers
| .NET | Node.js |
|------|---------|
| `Controllers/` | `src/controllers/` |
| `Application/Gateways/` | `src/gateways/` |
| `Application/Dtos/` | Inline interfaces or `src/dtos/` |
| `Infrastructure/Persistence/` | `src/config/database.js` + `src/models/` |
| `Infrastructure/Gateways/` | `src/gateways/` |

### Specific Files
| .NET | Node.js | Notes |
|------|---------|-------|
| `Program.cs` | `src/server.js` | Main entry point |
| `OemDbContext.cs` | `src/config/database.js` | DB connection |
| `OemTestController.cs` | `src/controllers/oemTestController.js` | Test endpoints |
| `IMasterDataGateway.cs` | Class with methods | No interfaces needed in JS |
| `MasterDataGateway.cs` | `src/gateways/masterDataGateway.js` | HTTP client wrapper |
| `VvnDto.cs` | Inline object | JS doesn't need DTOs |
| Firebase JWT setup | `src/config/firebase.js` | Auth middleware |
| Swagger setup | `src/config/swagger.js` | API documentation |

## Code Comparison

### Authentication Middleware

**C# (.NET)**
```csharp
[Authorize]
public IActionResult SecureEndpoint()
{
    var userEmail = User.FindFirst("email")?.Value;
    return Ok(new { message = $"Hello {userEmail}" });
}
```

**JavaScript (Node.js)**
```javascript
router.get('/secure', verifyFirebaseToken, (req, res) => {
    const userEmail = req.user?.email;
    res.json({ message: `Hello ${userEmail}` });
});
```

### Database Context

**C# (.NET)**
```csharp
var serverVersion = ServerVersion.AutoDetect(connectionString);
builder.Services.AddDbContext<OemDbContext>(options =>
    options.UseMySql(connectionString, serverVersion));
```

**JavaScript (Node.js)**
```javascript
await mongoose.connect(mongoUri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
});
```

### Gateway/HTTP Client

**C# (.NET)**
```csharp
public class MasterDataGateway : IMasterDataGateway
{
    private readonly HttpClient _httpClient;
    
    public async Task<VvnDto?> GetVvnAsync(string businessId)
    {
        var response = await _httpClient.GetAsync($"/api/notifications/{businessId}");
        return await response.Content.ReadFromJsonAsync<VvnDto>();
    }
}
```

**JavaScript (Node.js)**
```javascript
export class MasterDataGateway {
    constructor(baseUrl) {
        this.client = axios.create({ baseURL: baseUrl });
    }
    
    async getVvnAsync(businessId) {
        const response = await this.client.get(`/api/notifications/${businessId}`);
        return response.data;
    }
}
```

## Features Preserved

✅ **All architectural principles maintained:**
- Independent back-end service
- REST-based API
- Swagger/OpenAPI documentation
- Inter-module communication via REST (no direct DB access)
- Firebase Authentication (JWT)
- RBAC/ABAC ready
- CORS configuration
- Security headers (Helmet)
- Proper error handling

✅ **All test endpoints preserved:**
- `/api/oem/ping` - Health check
- `/api/oem/secure` - Auth test
- `/api/oem/check-vvn/:id` - Gateway test
- `/api/oem/check-db` - Database test

## What Still Needs to Be Done

### 1. Database Migration
Since you mentioned you'll handle the database later, here's what to do when ready:

**Option A: Keep MySQL**
- Use `mysql2` npm package instead of Mongoose
- Minimal code changes needed

**Option B: Use MongoDB (Recommended)**
- Already configured in this migration
- Need to migrate any existing data
- Update entity models to use Mongoose schemas

### 2. Add Domain Models
When you're ready to add business entities:

```javascript
// Example: src/models/OperationPlan.js
import mongoose from 'mongoose';

const operationPlanSchema = new mongoose.Schema({
    businessId: { type: String, required: true, unique: true },
    vvnId: { type: String, required: true },
    status: { type: String, enum: ['Draft', 'Approved'], default: 'Draft' },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('OperationPlan', operationPlanSchema);
```

### 3. Implement Business Logic Services
Keep your service layer separate from controllers:

```javascript
// src/services/operationPlanService.js
export class OperationPlanService {
    async createPlan(planData) {
        // Validation
        // Business rules
        // Save to database
        return createdPlan;
    }
}
```

### 4. Add RBAC/ABAC Authorization
Extend the Firebase middleware:

```javascript
export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user?.role;
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

// Usage:
router.post('/plans', verifyFirebaseToken, requireRole(['admin', 'manager']), ...);
```

## Running the Migration

### Step 1: Install Dependencies
```bash
cd PortProject.OEM.Api
npm install
```

### Step 2: Configure Environment
```bash
# Copy and edit .env file
cp .env.example .env
# Update MONGODB_URI when ready
```

### Step 3: Start the Server
```bash
npm run dev
```

### Step 4: Test All Endpoints
1. Open http://localhost:5274/api-docs
2. Test `/api/oem/ping` (should work immediately)
3. Test `/api/oem/check-db` (will work once MongoDB is set up)
4. Test `/api/oem/secure` (requires Firebase token)
5. Test `/api/oem/check-vvn/:id` (requires Master Data API running)

## Rollback Plan

If you need to revert to .NET temporarily:
1. The original C# files are still in the directory
2. Run the .NET version: `dotnet run` (from PortProject.OEM.Api directory)
3. The Node.js and .NET versions can coexist (use different ports)

## Support

Both versions follow the same REST API contract, so:
- Frontend doesn't need changes
- Master Data API communication is identical
- Authentication flow is the same
- Only the internal implementation differs

## Questions?

Common concerns:

**Q: Can I use MySQL with Node.js?**
A: Yes! Replace Mongoose with `mysql2` package. The gateway and controller logic stays the same.

**Q: Do I need to rewrite everything?**
A: No! The structure is already migrated. Just add your business logic as you did in C#.

**Q: Will performance differ?**
A: Node.js is excellent for I/O-heavy operations (which APIs are). Performance should be comparable or better for most use cases.

**Q: What about Entity Framework migrations?**
A: MongoDB doesn't need migrations (schema-less). If using MySQL with Node.js, use tools like `knex.js` for migrations.

