# CoachCompanion Code Review Checklist

Use this checklist when reviewing code for the CoachCompanion application.

## Functionality

- [ ] Does the feature work as expected?
- [ ] Does it handle edge cases properly?
- [ ] Does it respect user roles (coach vs parent)?
- [ ] Does it integrate with existing components/systems?
- [ ] Are there appropriate loading states for async operations?

## TypeScript/Type Safety

- [ ] Are all variables and functions properly typed?
- [ ] Are shared schema types used for database entities?
- [ ] Are there any unnecessary type assertions or `any` types?
- [ ] Is the codebase free from `any` types? If not, has each usage been justified with a detailed comment explaining why alternatives can't be used?
- [ ] Are the return types of async functions correct (e.g., `Promise<Entity | undefined>`)?
- [ ] Are optional properties handled safely with null checks or defaults?
- [ ] Are unknown data structures properly narrowed using type guards before use?

## Frontend

### Components

- [ ] Are components reasonably sized and focused?
- [ ] Is there appropriate separation of concerns?
- [ ] Are UI components from the design system used consistently?
- [ ] Are the component props documented?
- [ ] Are there clear loading/error/empty states?

### State Management

- [ ] Is React Query used for server state?
- [ ] Is local state used appropriately?
- [ ] Is context used to avoid prop drilling?
- [ ] Are states initialized with appropriate defaults?
- [ ] Is there any state that could be derived instead?

### Data Fetching

- [ ] Are API requests made using the query client?
- [ ] Is error handling implemented for all API calls?
- [ ] Are loading states displayed while data is fetching?
- [ ] Is query invalidation set up correctly?
- [ ] Are results properly typed?

### Forms

- [ ] Is React Hook Form used with zod validation?
- [ ] Are validation schemas from the shared schema used?
- [ ] Are form errors properly displayed to the user?
- [ ] Is form submission handling async operations correctly?
- [ ] Are all form inputs accessible?

## Backend

### API Routes

- [ ] Do routes follow RESTful conventions?
- [ ] Are routes protected with proper authentication middleware?
- [ ] Is authorization checked for protected resources?
- [ ] Is input validation implemented?
- [ ] Are error responses consistent and helpful?

### Database Operations

- [ ] Are operations implemented through the storage interface?
- [ ] Are database queries optimized?
- [ ] Is error handling implemented for database operations?
- [ ] Are transactions used where needed?
- [ ] Is logging implemented for failures?

### Authentication/Authorization

- [ ] Is authentication required for protected routes?
- [ ] Is role-based authorization checked?
- [ ] Is password handling done securely?
- [ ] Are sessions managed properly?
- [x] Is CSRF protection implemented using csrf-csrf package?
- [ ] Are non-GET/HEAD/OPTIONS requests including the CSRF token header?

## Testing

- [ ] Are there unit tests for new components?
- [ ] Are there tests for success and error paths?
- [ ] Are tests isolated from external dependencies?
- [ ] Are edge cases tested?
- [ ] Is there adequate test coverage?

## Performance

- [ ] Are expensive calculations memoized?
- [ ] Are renders optimized to prevent unnecessary re-renders?
- [ ] Are large lists virtualized if needed?
- [ ] Are queries configured with appropriate cache settings?
- [ ] Is bundling optimized (code splitting, tree shaking)?

## Security

- [ ] Is all user input validated and sanitized?
- [ ] Are there any potential XSS vulnerabilities?
- [ ] Is sensitive information properly protected?
- [ ] Are permissions checked consistently?
- [x] Is CSRF protection implemented using the double submit cookie pattern?
- [ ] Is the X-CSRF-Token header included in all mutation requests?

## Accessibility

- [ ] Are semantic HTML elements used?
- [ ] Do all interactive elements have appropriate ARIA attributes?
- [ ] Is keyboard navigation supported?
- [ ] Is there adequate color contrast?
- [ ] Are error messages accessible?

## Code Style and Maintainability

- [ ] Does the code follow the project's naming conventions?
- [ ] Is there consistent formatting?
- [ ] Are there appropriate comments for complex logic?
- [ ] Is the code DRY (Don't Repeat Yourself)?
- [ ] Are constants used instead of magic numbers/strings?

## Documentation

- [ ] Are complex functions documented with JSDoc?
- [ ] Are there comments explaining non-obvious logic?
- [ ] Is the README updated if needed?
- [ ] Are changes to the data model documented?
- [ ] Are new environment variables documented?

## Mobile Responsiveness

- [ ] Does the UI adapt well to different screen sizes?
- [ ] Are touch targets large enough for mobile devices?
- [ ] Is content properly visible without horizontal scrolling?
- [ ] Are mobile interactions (e.g., swipe) considered?
- [ ] Is responsive design tested on multiple viewports? 