# Testing Infrastructure Documentation

## Overview

The BaseballUmpireManager project has a comprehensive testing infrastructure built with Vitest, React Testing Library, and Supertest. This document outlines the testing strategy, setup, and best practices.

## Testing Stack

### Core Testing Tools
- **Vitest**: Fast unit test runner with TypeScript support
- **React Testing Library**: Component testing utilities
- **Supertest**: HTTP assertion library for API testing
- **MSW (Mock Service Worker)**: API mocking for integration tests
- **@testing-library/jest-dom**: Custom matchers for DOM testing

### Test Types
1. **Unit Tests**: Test individual functions, components, and utilities
2. **Integration Tests**: Test API endpoints and data flow
3. **Component Tests**: Test React components in isolation
4. **E2E Tests**: Test complete user workflows (future)

## Test Structure

```
test/
├── setup.ts                 # Global test setup
├── simple.test.ts          # Basic test verification
├── components/             # React component tests
│   ├── ui/                # UI component tests
│   └── role-selection.test.tsx
├── hooks/                 # Custom hook tests
│   └── use-auth.test.tsx
├── server/                # Server-side tests
│   ├── auth.test.ts       # Authentication tests
│   ├── storage.test.ts    # Database layer tests
│   ├── routes/            # API route tests
│   └── utils/             # Utility function tests
├── integration/           # Integration tests
│   └── auth-flow.test.ts  # End-to-end auth flow
├── lib/                   # Library function tests
└── shared/                # Shared utility tests
```

## Configuration

### Vitest Configuration (`vitest.config.ts`)
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: [
      './test/**/*.test.{ts,tsx}',
      './client/src/**/*.test.{ts,tsx}',
      './server/**/*.test.{ts,tsx}'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client', 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
});
```

### Test Setup (`test/setup.ts`)
```typescript
import '@testing-library/jest-dom';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock browser APIs
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
```

## Test Scripts

### Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:unit": "vitest run --reporter=verbose",
    "test:integration": "vitest run --reporter=verbose test/integration",
    "test:server": "vitest run --reporter=verbose test/server",
    "test:client": "vitest run --reporter=verbose test/components test/hooks test/lib"
  }
}
```

## Testing Patterns

### 1. Unit Tests

#### Function Testing
```typescript
import { describe, it, expect } from 'vitest';
import { validateEmail } from '@/utils/validation';

describe('validateEmail', () => {
  it('should validate correct email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co.uk')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
  });
});
```

#### Component Testing
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 2. Integration Tests

#### API Testing
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupAuth } from '../../server/auth';

describe('Authentication API', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    setupAuth(app);
  });

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/register')
      .send({
        username: 'newuser',
        password: 'password123',
        name: 'New User',
        role: 'Coach',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.username).toBe('newuser');
  });
});
```

### 3. Hook Testing
```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/use-auth';

describe('useAuth Hook', () => {
  it('should provide authentication state', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeDefined();
    expect(result.current.loginMutation).toBeDefined();
    expect(result.current.logoutMutation).toBeDefined();
  });
});
```

## Mocking Strategies

### 1. Module Mocking
```typescript
// Mock external dependencies
vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));
```

### 2. Database Mocking
```typescript
vi.mock('../../server/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));
```

### 3. Browser API Mocking
```typescript
// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;
```

## Test Coverage

### Coverage Goals
- **Statements**: 90%
- **Branches**: 85%
- **Functions**: 90%
- **Lines**: 90%

### Coverage Exclusions
- Configuration files
- Build scripts
- Type definitions
- Test files themselves

## Best Practices

### 1. Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names that explain the behavior
- Follow the AAA pattern: Arrange, Act, Assert

### 2. Component Testing
- Test user interactions, not implementation details
- Use semantic queries (getByRole, getByLabelText)
- Test accessibility features
- Mock external dependencies

### 3. API Testing
- Test both success and error scenarios
- Validate response structure and status codes
- Test authentication and authorization
- Mock database operations

### 4. Performance
- Keep tests fast and focused
- Use appropriate mocking strategies
- Avoid testing implementation details
- Use setup and teardown efficiently

## Common Test Patterns

### 1. Async Testing
```typescript
it('should handle async operations', async () => {
  const { result } = renderHook(() => useAsyncOperation());
  
  await act(async () => {
    await result.current.execute();
  });
  
  expect(result.current.data).toBeDefined();
});
```

### 2. Error Testing
```typescript
it('should handle errors gracefully', async () => {
  const mockError = new Error('Network error');
  vi.mocked(apiClient.get).mockRejectedValue(mockError);
  
  const { result } = renderHook(() => useData());
  
  await waitFor(() => {
    expect(result.current.error).toBe(mockError);
  });
});
```

### 3. User Interaction Testing
```typescript
it('should handle user input', async () => {
  render(<LoginForm />);
  
  const usernameInput = screen.getByLabelText(/username/i);
  const passwordInput = screen.getByLabelText(/password/i);
  const submitButton = screen.getByRole('button', { name: /login/i });
  
  fireEvent.change(usernameInput, { target: { value: 'testuser' } });
  fireEvent.change(passwordInput, { target: { value: 'password123' } });
  fireEvent.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
  });
});
```

## Debugging Tests

### 1. Debug Mode
```bash
# Run tests in debug mode
npm run test:watch -- --reporter=verbose
```

### 2. Single Test Execution
```bash
# Run a specific test file
npx vitest run test/components/button.test.tsx

# Run a specific test
npx vitest run test/components/button.test.tsx -t "should handle click"
```

### 3. Coverage Analysis
```bash
# Generate coverage report
npm run test:coverage

# Open coverage report
open coverage/index.html
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run build
```

## Troubleshooting

### Common Issues

1. **Tests not found**: Check file naming and include patterns
2. **Import errors**: Verify path aliases and module resolution
3. **Mock not working**: Ensure mocks are defined before imports
4. **Async test failures**: Use proper async/await patterns
5. **Component not rendering**: Check for missing providers or context

### Debug Commands
```bash
# Check test configuration
npx vitest --config vitest.config.ts --dry-run

# Run with verbose output
npx vitest run --reporter=verbose

# Check TypeScript errors
npx tsc --noEmit
```

## Future Enhancements

1. **E2E Testing**: Add Playwright or Cypress for end-to-end tests
2. **Visual Testing**: Add visual regression testing
3. **Performance Testing**: Add performance benchmarks
4. **Security Testing**: Add security-focused test cases
5. **Accessibility Testing**: Add automated accessibility checks

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom) 