# Testing Guide - Port Project

This document provides comprehensive information about testing in the Port Project, covering both backend (.NET) and frontend (React/TypeScript) testing.

---

## 📋 Table of Contents

- [Backend Testing (.NET API)](#backend-testing-net-api)
- [Frontend Testing (React SPA)](#frontend-testing-react-spa)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)

---

## Backend Testing (.NET API)

The backend follows a **testing pyramid** approach with three test project types:

### 1. **Unit Tests** (`PortProject.Api.Tests`)

Tests individual components in isolation using mocks and stubs.

**Covers:**
- Domain models and aggregates (Vessel, VesselType, ShippingAgentOrganization)
- Controllers and request/response handling
- Application services and business logic

**Example:**
```bash
dotnet test PortProject.Api.Tests
```

### 2. **Integration Tests** (`PortProject.Api.Integration_Tests`)

Tests API endpoints with real database interactions.

**Test Files:**
- `VesselTypeTest.cs`
- `VesselTest.cs`
- `DockTest.cs`
- `StorageAreaTest.cs`
- `ShippingAgentOrganizationTest.cs`
- `ShippingAgentRepresentativeTest.cs`
- `VesselVisitNotificationTest.cs`
- `ResourceTest.cs`
- `QualificationTests.cs`
- `StaffMemberTests.cs`

**Example:**
```bash
dotnet test PortProject.Api.Integration_Tests
```

### 3. **System Tests** (`Port.Project.Api.System_Tests`)

Tests complete application workflows and data consistency.

**Contains:**
- **DataConsistencySystemTests**: Validates relationships, foreign keys, and data integrity
- **PortOperationsSystemTests**: End-to-end workflows simulating real port operations

**Example:**
```bash
dotnet test Port.Project.Api.System_Tests
```

---

## Frontend Testing (React SPA)

The frontend uses **Vitest** and **React Testing Library** for unit tests, and **Playwright** for E2E tests.

### Unit Tests

**Location:** `port-spa-app/src/test/`

**Test Files:**
- `pages/CreateVvnPage.test.tsx` - Tests VVN creation form (rendering, interactions, validation)
- `pages/VesselVisitsPage.test.tsx` - Tests VVN list view (role-based views, filtering)
- `components/VvnCard.test.tsx` - Tests notification card display and actions
- `components/VvnDecisionModal.test.tsx` - Tests approval/rejection modals
- `components/VvnDetailsModal.test.tsx` - Tests notification details view

**What's Tested:**
- Component rendering
- Form interactions and validation
- Dynamic list management (containers, crew members)
- Role-based UI (Agent vs Officer views)
- Modal interactions
- Button states based on notification status

**Example Test:**
```tsx
import { render, screen } from '@testing-library/react';
import CreateVvnPage from '../../pages/CreateVvnPage';

describe('CreateVvnPage', () => {
  it('renders the form correctly', () => {
    render(<CreateVvnPage />);
    expect(screen.getByText('Create New Vessel Visit Notification')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

**Location:** `port-spa-app/e2e/`

**Test Files:**
- `real-auth-tests.spec.ts` - Authentication and basic navigation (✅ 8/8 passing)
- `demo-tests.spec.ts` - Demo and educational tests (✅ 6/6 passing)
- `vessel-visit-notification.spec.ts` - VVN workflows (✅ 17/17 passing)
- `vessel-visit-complete-workflow.spec.ts` - Validation and performance (✅ 3/3 passing)

**What's Tested:**
- Real authentication flow with Firebase/Auth0
- Complete VVN creation workflow (3 steps)
- Search and filter functionality
- Submit, approve, and reject workflows
- Role-based access and permissions
- Form validation
- Page load performance

**Key Features:**
- Uses real authentication (not mocks)
- Tests with actual user credentials
- Handles role-based UI differences
- Validates full user journeys

---

## Running Tests

### Backend Tests

```bash
# Run all backend tests
dotnet test

# Run specific test project
dotnet test PortProject.Api.Tests
dotnet test PortProject.Api.Integration_Tests
dotnet test Port.Project.Api.System_Tests

# Run specific test file
dotnet test --filter "FullyQualifiedName~VesselTypeTest"

# Run with code coverage
dotnet test --collect:"XPlat Code Coverage"
```

### Frontend Unit Tests

```bash
cd port-spa-app

# Run all unit tests (watch mode)
npm test

# Run tests once (CI mode)
npm run test:ci

# Run with coverage
npm run test:coverage
```

### Frontend E2E Tests

```bash
cd port-spa-app

# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test vessel-visit-notification.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Debug a specific test
npx playwright test vessel-visit-notification.spec.ts:91 --headed --debug

# View HTML report
npx playwright show-report
```

---

## Test Coverage

### Backend Coverage

```
Unit Tests: ~150 tests
Integration Tests: ~80 tests
System Tests: ~20 tests
Total: ~250 tests
```

**Key Areas Covered:**
- ✅ Domain logic and business rules
- ✅ API endpoints and controllers
- ✅ Database operations and relationships
- ✅ Data validation and constraints
- ✅ Complete port operations workflows

### Frontend Coverage

```
Unit Tests: ~50 tests
E2E Tests: ~34 tests
Total: ~84 tests
```

**Key Areas Covered:**
- ✅ VVN creation form (all 3 steps)
- ✅ VVN list and filtering
- ✅ Role-based views (Agent/Officer)
- ✅ Approval/rejection workflows
- ✅ Authentication and navigation
- ✅ Form validation
- ✅ Modal interactions

### Current Test Status

**Backend:** ✅ All tests passing  
**Frontend Unit Tests:** ✅ All tests passing  
**Frontend E2E Tests:** ✅ 34/34 passing (100%)

---

## Writing Tests

### Backend Unit Test Example

```csharp
[Fact]
public void CreateVessel_WithValidData_ReturnsVessel()
{
    // Arrange
    var vesselData = new VesselDto { IMO = "1234567", Name = "Test Vessel" };
    
    // Act
    var result = _vesselService.CreateVessel(vesselData);
    
    // Assert
    Assert.NotNull(result);
    Assert.Equal("1234567", result.IMO);
}
```

### Frontend Unit Test Example

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import CreateVvnPage from '../../pages/CreateVvnPage';

describe('CreateVvnPage', () => {
  it('validates required fields', async () => {
    render(<CreateVvnPage />);
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);
    
    // Form should show validation errors
    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });
});
```

### Frontend E2E Test Example

```typescript
test('Agent can create vessel visit notification', async ({ page }) => {
  await RealAuthHelper.loginWithCredentials(page);
  
  await page.goto('/vessel-visits/new');
  
  // Fill step 1
  await page.fill('#vesselImo', 'IMO1234567');
  await page.fill('#estimatedArrival', '2025-12-01T10:00');
  await page.getByRole('button', { name: /next/i }).click();
  
  // Fill step 2
  await page.fill('#description', 'Test cargo');
  await page.getByRole('button', { name: /next/i }).click();
  
  // Submit
  await page.getByRole('button', { name: /create/i }).click();
  
  // Verify redirect
  await expect(page).toHaveURL(/\/vessel-visits$/);
});
```

---

## Test Configuration

### Backend Configuration

Test configuration is handled through:
- `appsettings.Test.json` - Test database connection
- `IntegrationTestsWebApplicationFactory.cs` - Test server setup

### Frontend Configuration

**Unit Tests:** `vitest.config.ts`
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

**E2E Tests:** `playwright.config.ts`
```typescript
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
  },
});
```

---

## Continuous Integration

Tests run automatically on every pull request:

```yaml
# .github/workflows/test.yml
- Backend tests run with `dotnet test`
- Frontend unit tests run with `npm test`
- E2E tests run with `npx playwright test`
```

---

## Troubleshooting

### Backend Tests

**Issue:** Tests fail with database connection errors  
**Solution:** Ensure test database is configured in `appsettings.Test.json`

**Issue:** Integration tests timeout  
**Solution:** Increase timeout in test attributes: `[Fact(Timeout = 10000)]`

### Frontend Unit Tests

**Issue:** "Cannot find module" errors  
**Solution:** Clear cache with `npx vitest --clearCache`

**Issue:** Tests fail in CI but pass locally  
**Solution:** Use `npm run test:ci` to run tests in CI mode

### Frontend E2E Tests

**Issue:** Authentication failures  
**Solution:** Verify credentials in `real-auth.ts` helper

**Issue:** Element not found errors  
**Solution:** Add proper wait times: `await page.waitForLoadState('networkidle')`

**Issue:** Tests timeout  
**Solution:** Increase timeout in test or use `--timeout` flag

---

## Best Practices

### Backend
- ✅ Use meaningful test names describing what's being tested
- ✅ Follow AAA pattern (Arrange, Act, Assert)
- ✅ Mock external dependencies in unit tests
- ✅ Use real database in integration tests
- ✅ Clean up test data after each test

### Frontend Unit Tests
- ✅ Test user interactions, not implementation details
- ✅ Use `screen` queries for better maintainability
- ✅ Avoid testing library internals
- ✅ Mock external API calls
- ✅ Test accessibility (aria labels, roles)

### Frontend E2E Tests
- ✅ Use real authentication, not mocks
- ✅ Add proper wait times for async operations
- ✅ Use meaningful selectors (roles, labels)
- ✅ Make tests resilient to UI changes
- ✅ Clean up test data when possible

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [xUnit Documentation](https://xunit.net/)
- [Moq Documentation](https://github.com/moq/moq4)

---

**Last Updated:** November 21, 2025  
**Maintained By:** Development Team  
**Status:** ✅ All tests passing (284+ tests total)
