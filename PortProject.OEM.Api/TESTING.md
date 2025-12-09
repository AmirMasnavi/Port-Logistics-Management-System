# Testing Guide - OEM API Module

This document provides detailed information about testing in the Operations & Execution Management (OEM) API module, a Node.js/Express backend service with MongoDB.

---

## 📋 Table of Contents

- [Testing Tools & Framework](#testing-tools--framework)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Types](#test-types)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)

---

## Testing Tools & Framework

The OEM API uses the following testing stack:

### **Jest**
- **Purpose**: Primary testing framework for JavaScript/Node.js
- **Version**: 29.7.0
- **Features**: Test runner, assertion library, mocking capabilities, code coverage
- **Configuration**: `jest.config.js` in the root directory

### **Supertest**
- **Purpose**: HTTP assertion library for testing Express APIs
- **Version**: 6.3.3
- **Use Case**: Making HTTP requests to test API endpoints

### **MongoDB Memory Server**
- **Purpose**: In-memory MongoDB instance for testing
- **Version**: 9.1.3
- **Use Case**: Integration tests requiring database operations without affecting production/development databases

### **Node.js VM Modules**
- **Purpose**: Enable ES6 module support in Jest
- **Usage**: Required for running tests with `import/export` syntax

---

## Test Structure

Tests are organized in the `tests/` directory with the following structure:

```
tests/
├── setup.js                    # Global test setup configuration
├── helpers/                    # Test utilities and helper functions
├── unit/                       # Unit tests (isolated component testing)
│   └── dtos/                   # Data Transfer Object tests
│       └── OperationPlanDto.test.js
├── integration/                # Integration tests (service layer with database)
│   └── services/
│       └── operationPlanService.test.js
└── api/                        # API/E2E tests (full HTTP request/response cycle)
    ├── plans.test.js
    └── debug.test.js
```

### Test Naming Convention
- Test files use the `.test.js` extension
- Files are named after the module they test: `{ModuleName}.test.js`

---

## Running Tests

### Run All Tests

Execute the entire test suite:

```bash
npm test
```

This runs all tests across unit, integration, and API test directories.

---

### Run Specific Test Types

#### 1. **Unit Tests Only**

Run tests that focus on individual components in isolation:

```bash
npm run test:unit
```

**What it tests:**
- Data Transfer Objects (DTOs)
- Model validation
- Utility functions
- Business logic without external dependencies

**Example tests:**
- DTO transformation and validation
- Data mapping functions
- Pure business logic calculations

---

#### 2. **Integration Tests Only**

Run tests that verify service layer interactions with the database:

```bash
npm run test:integration
```

**What it tests:**
- Service layer methods
- Database operations (CRUD)
- Data persistence and retrieval
- Business logic with database integration

**Example tests:**
- Creating operation plans in the database
- Querying and filtering data
- Updating and deleting records
- Transaction handling

---

#### 3. **API Tests Only**

Run end-to-end tests that test complete HTTP request/response cycles:

```bash
npm run test:api
```

**What it tests:**
- HTTP endpoints (GET, POST, PUT, DELETE)
- Request validation
- Response status codes and bodies
- Authentication and authorization
- Error handling

**Example tests:**
- `POST /api/plans` - Create a new operation plan
- `GET /api/plans` - Retrieve operation plans
- `GET /api/debug` - Debug endpoint testing

---

### Advanced Test Commands

#### Watch Mode

Run tests in watch mode (automatically re-runs on file changes):

```bash
npm run test:watch
```

**Use case:** During active development to get instant feedback

---

#### Test Coverage

Generate code coverage report:

```bash
npm run test:coverage
```

**Output:**
- Console summary showing coverage percentages
- HTML report in `coverage/` directory
- LCOV report for CI/CD integration

**Coverage includes:**
- Statement coverage
- Branch coverage
- Function coverage
- Line coverage

**Open coverage report:**
```bash
open coverage/index.html
```

---

#### Run Specific Test File

Run a single test file:

```bash
npm test -- tests/unit/dtos/OperationPlanDto.test.js
```

Or using pattern matching:

```bash
npm test -- --testPathPattern=OperationPlanDto
```

---

#### Run Tests Matching a Pattern

Run all tests with "plan" in the filename:

```bash
npm test -- --testNamePattern=plan
```

Run tests matching a specific describe/test block:

```bash
npm test -- --testNamePattern="should create operation plan"
```

---

#### Run Tests with Verbose Output

Get detailed output for each test:

```bash
npm test -- --verbose
```

---

#### Run Tests in Silent Mode

Minimize console output:

```bash
npm test -- --silent
```

---

## Test Types

### 1. Unit Tests (`tests/unit/`)

**Purpose:** Test individual components in complete isolation

**Characteristics:**
- No external dependencies (database, API calls)
- Use mocks and stubs for dependencies
- Fast execution (milliseconds)
- Focus on single responsibility

**Example - DTO Test:**
```javascript
// tests/unit/dtos/OperationPlanDto.test.js
describe('OperationPlanDto', () => {
  test('should transform raw data correctly', () => {
    const rawData = { /* ... */ };
    const dto = new OperationPlanDto(rawData);
    expect(dto.id).toBeDefined();
    expect(dto.name).toBe(rawData.name);
  });
});
```

**Run:** `npm run test:unit`

---

### 2. Integration Tests (`tests/integration/`)

**Purpose:** Test service layer integration with database

**Characteristics:**
- Uses MongoDB Memory Server (in-memory database)
- Tests data persistence and retrieval
- Verifies service methods work with real database operations
- Moderate execution time (seconds)

**Example - Service Test:**
```javascript
// tests/integration/services/operationPlanService.test.js
describe('OperationPlanService', () => {
  test('should create and retrieve operation plan', async () => {
    const plan = await operationPlanService.create(planData);
    expect(plan._id).toBeDefined();
    
    const retrieved = await operationPlanService.findById(plan._id);
    expect(retrieved.name).toBe(planData.name);
  });
});
```

**Run:** `npm run test:integration`

---

### 3. API Tests (`tests/api/`)

**Purpose:** Test complete HTTP request/response cycles (E2E)

**Characteristics:**
- Uses Supertest to make HTTP requests
- Tests entire request pipeline (routing, validation, controller, service, database)
- Verifies response status codes, headers, and body
- Slower execution (seconds to minutes)

**Example - API Test:**
```javascript
// tests/api/plans.test.js
describe('POST /api/plans', () => {
  test('should create new operation plan', async () => {
    const response = await request(app)
      .post('/api/plans')
      .send(planData)
      .expect(201);
    
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.name).toBe(planData.name);
  });
});
```

**Run:** `npm run test:api`

---

## Writing Tests

### Basic Test Structure

```javascript
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('Feature Name', () => {
  // Setup before each test
  beforeEach(() => {
    // Initialize test data
  });

  // Cleanup after each test
  afterEach(() => {
    // Clean up resources
  });

  test('should do something specific', () => {
    // Arrange: Set up test data
    const input = { /* ... */ };

    // Act: Execute the code being tested
    const result = someFunction(input);

    // Assert: Verify the result
    expect(result).toBe(expectedValue);
  });
});
```

### Common Jest Matchers

```javascript
// Equality
expect(value).toBe(5);                    // Strict equality (===)
expect(value).toEqual({ a: 1 });          // Deep equality

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeDefined();
expect(value).toBeUndefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThanOrEqual(5);

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Objects
expect(object).toHaveProperty('key');
expect(object).toHaveProperty('key', value);

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow(Error);
```

### Mocking

```javascript
// Mock a function
const mockFn = jest.fn();
mockFn.mockReturnValue(42);
mockFn.mockResolvedValue('async result');

// Mock a module
jest.mock('../services/externalService');

// Spy on a method
const spy = jest.spyOn(object, 'method');
```

---

## Best Practices

### General Testing Principles

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **One Assertion Per Test**: Focus on testing one thing at a time
3. **Descriptive Test Names**: Use clear, descriptive test descriptions
4. **Independent Tests**: Each test should be able to run in isolation
5. **Clean Up**: Always clean up resources (database, mocks) after tests

### Unit Testing

- Mock all external dependencies
- Test edge cases and error conditions
- Keep tests fast (under 100ms per test)
- Test public interfaces, not implementation details

### Integration Testing

- Use in-memory database (MongoDB Memory Server)
- Reset database state between tests
- Test realistic scenarios with actual data flows
- Verify data persistence and relationships

### API Testing

- Test all HTTP methods (GET, POST, PUT, DELETE)
- Verify status codes (200, 201, 400, 404, 500)
- Test authentication and authorization
- Validate request/response payloads
- Test error handling and edge cases

### Code Coverage Goals

- **Minimum**: 70% overall coverage
- **Target**: 80%+ overall coverage
- **Critical code**: 90%+ coverage (business logic, services)
- **Focus**: Quality over quantity - meaningful tests are more valuable than high coverage

---

## Continuous Integration

Tests are automatically run in CI/CD pipelines to ensure code quality:

```bash
# CI Command
npm run test:coverage
```

This generates coverage reports that can be integrated with tools like:
- SonarQube
- Codecov
- Coveralls

---

## Troubleshooting

### Tests Timeout

If tests timeout, increase the timeout in `jest.config.js` or individual tests:

```javascript
test('slow test', async () => {
  // test code
}, 60000); // 60 second timeout
```

### MongoDB Memory Server Issues

If MongoDB Memory Server fails to start:

```bash
# Clear cache
rm -rf ~/.cache/mongodb-memory-server
```

### Module Import Errors

Ensure you're using the correct import syntax for ES6 modules:

```javascript
import { something } from './module.js'; // Include .js extension
```

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
- [Express Testing Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

