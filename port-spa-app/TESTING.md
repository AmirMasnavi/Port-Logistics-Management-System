# Frontend Testing Guide

This project uses [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for unit testing.

## Running Tests

To run all tests, execute the following command in the `port-spa-app` directory:

```bash
npm test
```

This will run Vitest in watch mode by default.

## Test Structure

Tests are located in the `src/test` directory, mirroring the source structure where possible.

- `src/test/pages/`: Tests for page components.
- `src/test/components/`: Tests for reusable components.
- `src/test/setup.ts`: Global test setup configuration.

## Writing Tests

Create a new test file with the `.test.tsx` extension in the appropriate directory.

Example:
```tsx
import { render, screen } from '@testing-library/react';
import MyComponent from '../../components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
```

## Configuration

The test configuration is located in `vitest.config.ts`.
