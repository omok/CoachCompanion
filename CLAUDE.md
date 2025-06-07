# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

**Development:**
- `npm run dev` - Start development server (includes both client and server)
- `npm run build` - Build for production
- `npm run check` - TypeScript type checking

**Database:**
- `npm run db:push` - Push database schema changes (via Drizzle)

**Testing:**
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode 
- `npm run test:coverage` - Run tests with coverage report

**Single test execution:**
- `npx vitest run path/to/test.test.ts` - Run specific test file
- `npx vitest run --grep "test name"` - Run specific test by name

## Architecture Overview

### Layered Architecture
- **Client Layer**: React frontend in `client/` using TanStack Query for state management
- **API Layer**: Express.js RESTful API in `server/routes/` organized by resource
- **Storage Layer**: Business logic in `server/storage.ts` with clean interface
- **Database Layer**: PostgreSQL with Drizzle ORM for type-safe operations

### Key Directories
- `client/src/components/` - React components including shadcn/ui components
- `server/routes/` - API routes organized by resource (teams, players, etc.)
- `shared/` - Code shared between client and server (schema, types, constants)
- `server/storage.ts` - All database operations go through this file

### Permission System
Two-tiered permission system:
1. **User Roles**: Coach (can create teams) vs Normal/Parent (view only)
2. **Team Roles**: Owner, AssistantCoach, TeamManager, Regular with different permissions

All permissions defined in `shared/access-control.ts`. Use `usePermissions` hook for client-side checks and authorization middleware for server-side enforcement.

## Critical Development Patterns

### TypeScript Requirements
- **Strict typing**: No `any` types allowed - use `unknown` with type guards instead
- Use shared types from `shared/schema.ts` for database entities
- Include `lastUpdatedByUser` field in all entity operations for audit trail

### Data Access
- All database operations MUST go through `server/storage.ts`
- Use the Storage class methods, never direct database queries in routes
- Always set `lastUpdatedByUser` for audit trail

### Authentication & Authorization
- Routes requiring auth: use authentication middleware
- User role permissions: use `requireUserTypePermission` middleware  
- Team role permissions: use `requireTeamRolePermission` middleware
- CSRF protection required for all non-GET routes

### Date Handling
- Use YYYY-MM-DD string format for dates in API requests/responses
- Validate date strings with regex before processing
- Support date range filtering for relevant endpoints
- Follow guidelines in `docs/date-handling.md`

### Form Validation
- Use React Hook Form with Zod validation schemas
- Reuse validation schemas from `shared/schema.ts`
- Use numeric strings for monetary values to avoid precision issues

### Testing Structure
- Tests in `test/` directory using Vitest and jsdom
- Component tests in `test/components/`
- Server/route tests in `test/server/`
- Use `@testing-library/react` for component testing

## Code Standards

### Component Structure
- Split components over 400 lines into smaller parts
- Use naming convention: `{feature}-{type}.tsx`
- Leverage `usePermissions` hook for conditional rendering
- Use TanStack Query for server state, local state for UI state

### API Patterns
- Follow RESTful design organized by resource
- Export router factory functions: `createEntityRouter(storage: IStorage)`
- Include proper error handling and HTTP status codes
- Support query parameters for filtering (especially date ranges)

### Database Operations
Always follow this pattern in `storage.ts`:
```typescript
async getEntityById(id: number): Promise<Entity | undefined> {
  try {
    const result = await db.select().from(entities).where(eq(entities.id, id));
    return result[0];
  } catch (error) {
    Logger.error("Error in getEntityById", error);
    throw error;
  }
}
```

## Security Requirements
- Input validation using Zod schemas on both client and server
- Proper authorization middleware for all protected routes
- Match client-side permission checks with server-side enforcement
- Users can only access data they are authorized to see
- No sensitive information in logs or error messages

## Important Files
- `shared/schema.ts` - Database schema and validation
- `shared/access-control.ts` - Permission definitions and constants
- `server/storage.ts` - All database operations interface
- `server/utils/authorization.ts` - Authorization middleware
- `client/src/hooks/usePermissions.ts` - Client-side permission checking