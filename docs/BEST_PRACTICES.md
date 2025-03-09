# CoachCompanion Best Practices

This document summarizes the best practices observed in the CoachCompanion codebase that should be followed in all future development.

## Architecture Best Practices

1. **Clean Separation of Concerns**
   - Frontend and backend code are clearly separated
   - Shared types maintain consistency across the stack
   - Business logic is separated from UI components
   - Permission logic is centralized in one place

2. **TypeScript Throughout**
   - Leveraging TypeScript for both frontend and backend ensures type safety
   - Shared schema types prevent inconsistencies between client and server
   - Types are exported cleanly at the bottom of schema files
   - The `any` type is never used - it defeats the purpose of TypeScript's type safety
   - When dealing with unknown data structures, use `unknown` type with proper type narrowing
   - Constants are used for enum-like values instead of string literals

3. **Modular API Design**
   - API endpoints are grouped by resource and organized in separate files
   - Routes follow RESTful principles
   - Route handlers are clean and focused on a single responsibility
   - Query parameters are supported for filtering operations
   - Date range filtering is implemented consistently

4. **Complete Audit Trail**
   - All database tables include a `lastUpdatedByUser` column
   - This provides traceability for every data change
   - The storage layer automatically handles populating this field
   - Creates accountability throughout the system

## Frontend Best Practices

1. **Component Structure**
   - Components are named clearly with a `{feature}-{type}.tsx` convention
   - UI components are imported from a common design system
   - Components have clear responsibilities and manageable size
   - Large components are split into smaller, more focused subcomponents

2. **Data Fetching with React Query**
   - Centralized query client configuration
   - Consistent pattern for queries and mutations
   - Proper error handling and loading states
   - Query invalidation for keeping data fresh
   - Date range parameters for filterable endpoints

3. **Form Handling**
   - Consistent use of React Hook Form
   - Zod validation schemas shared with the backend
   - Clear error display for users
   - Numeric strings for monetary values to avoid precision issues
   - Standardized date handling using YYYY-MM-DD format

4. **Error Handling**
   - Proper loading states during async operations
   - Toast notifications for user feedback
   - Consistent pattern for API error handling
   - Error boundaries to prevent cascading failures

5. **Permission-Based UI**
   - Components conditionally render based on user permissions
   - The `usePermissions` hook provides a clean API for permission checks
   - UI elements are hidden when the user lacks permission
   - Client-side permission checks match server-side enforcement

6. **Logging**
   - Consistent logging pattern for debugging:
   ```typescript
   const logEvent = (component: string, action: string, data?: unknown) => {
     const timestamp = new Date().toISOString();
     console.log(`[${timestamp}] [${component}] ${action}`, data ? data : '');
   };
   ```

7. **Authentication Context**
   - Authentication state is managed in a centralized context
   - Login and logout operations are exposed through mutations
   - User role information is available throughout the app
   - Session management works seamlessly with server-side auth

## Backend Best Practices

1. **Storage Interface Pattern**
   - Database operations are abstracted behind a clean interface
   - Consistent error handling for database operations
   - Parameterized queries for security
   - Clear separation of database logic from route handlers
   - Audit trail maintenance through `lastUpdatedByUser` field

2. **Authentication Implementation**
   - Session-based authentication with secure cookies
   - Password hashing with scrypt and salts
   - CSRF protection for enhanced security
   - Role-based authorization checks

3. **Unified Permission System**
   - Single source of truth for all permissions in `shared/access-control.ts`
   - Two-level permission model:
     - User Role permissions for application-wide access
     - Team Role permissions for team-specific actions
   - Middleware functions for enforcing permissions
   - Constants for permission keys to prevent typos

4. **Date Handling**
   - Consistent approach to date handling throughout the application
   - Use of YYYY-MM-DD string format for API communication
   - Validation of date strings before processing
   - Support for date range filtering on relevant endpoints

5. **Error Handling**
   - Consistent error responses with appropriate status codes
   - Different error details in development vs production
   - Proper logging of errors
   - Structured error responses for client consumption

6. **Input Validation**
   - All user input is validated using Zod schemas
   - Validation schemas are shared with the frontend
   - Type conversion is handled securely
   - Special handling for dates and numeric values

## Data Modeling Best Practices

1. **Schema Design**
   - Clear entity relationships
   - Proper foreign key relationships
   - Consistent naming conventions
   - Boolean flags for toggleable state (e.g., active players)
   - Audit fields on all tables

2. **Team-Centric Architecture**
   - Teams are the central organizational unit
   - Team membership determines access rights
   - Users can belong to multiple teams with different roles
   - Resources (players, payments, etc.) belong to teams

3. **Validation Schemas**
   - Zod schemas for all database entities
   - Type transformations handled in the schema
   - Required vs optional fields clearly defined
   - Consistent validation rules across the app

4. **Audit Trail**
   - All entity tables include `lastUpdatedByUser` column
   - This integer column references the user ID who last modified the record
   - The storage layer automatically sets this column on create/update operations
   - This provides a complete audit trail of data changes
   - The current user's ID must be provided in the context for all operations

## Testing Best Practices

1. **Test Organization**
   - Tests located in a separate `test/` directory
   - Clear naming convention for test files
   - Tests for both frontend and backend components

2. **Test Coverage**
   - Tests for happy paths and error scenarios
   - Mock dependencies for isolated testing
   - UI component testing with testing-library
   - Permission testing to verify access control

## Security Best Practices

1. **Authentication Security**
   - Secure password storage with proper hashing algorithm
   - Session management with secure cookies
   - CSRF protection via double submit cookie pattern using csrf-csrf
   - Token refreshing for invalid CSRF tokens

2. **Authorization Checks**
   - Two-tiered permission model (user roles and team roles)
   - Server-side verification for all protected operations
   - Consistent checking of resource ownership
   - Middleware-based enforcement

3. **Input Handling**
   - Validation of all user input
   - Parameterized queries to prevent SQL injection
   - Sanitization of user-generated content
   - Type checking and conversion

## Performance Best Practices

1. **Query Optimization**
   - Proper React Query configuration for caching
   - Strategic query invalidation
   - Memoization of expensive calculations
   - Server-side filtering for efficiency

2. **UI Rendering**
   - Avoiding unnecessary re-renders
   - Using useMemo and useCallback appropriately
   - Optimizing list rendering
   - Breaking large components into smaller pieces

3. **Date Range Filtering**
   - Implement date range filters on the server side
   - Allow flexible date range queries for reports
   - Optimize database queries for date filtering
   - Standardize date parameters across endpoints

## Development Workflow Best Practices

1. **Environment Configuration**
   - Using .env for environment variables
   - Different configurations for development and production
   - Secure handling of secrets

2. **Error Logging**
   - Structured logging with timestamps and component names
   - Different verbosity in development vs production
   - Focusing on actionable information

3. **Documentation Maintenance**
   - Keep documentation in sync with code
   - Update API documentation when endpoints change
   - Document permission changes in access-control.ts
   - Maintain clear explanations for architectural decisions

These best practices have been extracted from the CoachCompanion codebase and should be followed to maintain code quality and consistency when making future enhancements. 