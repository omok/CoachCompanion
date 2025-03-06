# CoachCompanion Cursor Rules

This document contains the coding standards and patterns to follow when working on the CoachCompanion application.

## Project Structure

- **Client**: All frontend code in `client/` directory
  - Components in `client/src/components/`
  - Pages in `client/src/pages/`
  - Hooks in `client/src/hooks/`
  - Utility functions in `client/src/lib/`
- **Server**: All backend code in `server/` directory
  - Routes in `server/routes/`
  - Database operations in `server/storage.ts`
  - Authentication in `server/auth.ts`
- **Shared**: Code shared between client and server in `shared/` directory
  - Database schema in `shared/schema.ts`

## TypeScript Standards

1. **Use strict typing**: Always define proper interfaces and types for all variables and function parameters.
2. **Leverage shared types**: Use the shared schema types from `shared/schema.ts` whenever working with database entities.
3. **No `any` type**: The `any` type is strictly prohibited. Use proper type unions, generics, or the `unknown` type with type guards instead.
   - Instead of `any`, use `unknown` with type checking: `function process(data: unknown): string { if (typeof data === 'string') return data; throw new Error('Expected string'); }`
   - For API responses, define proper interfaces reflecting the expected response structure
   - For complex objects with varying structures, use discriminated unions or generics
4. **Type exports**: Maintain type exports at the bottom of schema files for consistency.

## Frontend Patterns

1. **Component Structure**:
   - Split complex components into smaller, reusable parts
   - Use the provided UI components from `client/src/components/ui/`
   - Follow the naming convention of `{feature}-{type}.tsx` (e.g., `team-roster.tsx`)

2. **State Management**:
   - Use React Query for server state management
   - Use local state (useState) for UI state
   - Use context for global state (auth, player selection)
   - Avoid prop drilling - use context when passing data through many components

3. **Data Fetching**:
   - Always use the query client from `client/src/lib/queryClient.ts`
   - Follow the established pattern for API requests:
     ```typescript
     const { data, isLoading } = useQuery<DataType[]>({
       queryKey: [`/api/endpoint/${id}`],
     });
     ```
   - For mutations, follow:
     ```typescript
     const mutation = useMutation({
       mutationFn: async (data) => {
         const res = await apiRequest("POST", "/api/endpoint", data);
         if (!res.ok) {
           // Error handling
         }
         return await res.json();
       },
       onSuccess: () => {
         // Handle success, invalidate queries
         queryClient.invalidateQueries({ queryKey: ["/api/endpoint"] });
       },
     });
     ```

4. **Error Handling**:
   - Use toast notifications for user feedback on errors
   - Implement proper loading states for all async operations
   - Add error boundaries for component-level error handling

5. **Form Handling**:
   - Use React Hook Form with zod validation schemas
   - Reuse validation schemas from `shared/schema.ts`

6. **Logging**:
   - Use the established logging pattern with component name and action
   - Include non-sensitive debug data in development

## Backend Patterns

1. **API Routes**:
   - Create route handlers in separate files in `server/routes/`
   - Follow RESTful principles for endpoint design
   - Use middleware for authorization checks
   - Follow the pattern:
     ```typescript
     export function createEntityRouter(storage: IStorage) {
       const router = express.Router({ mergeParams: true });
       
       router.get("/", async (req, res) => {
         // Handler code
       });
       
       return router;
     }
     ```

2. **Database Operations**:
   - All database operations must go through the storage interface
   - Implement new features as methods on the Storage class in `server/storage.ts`
   - Follow the established pattern:
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

3. **Authentication**:
   - Use the authentication middleware for routes that require authentication
   - Use role-based checks for authorization (coach vs. parent)
   - Password handling must use the scrypt implementation in `server/auth.ts`

4. **Error Handling**:
   - Use try/catch blocks in all async functions
   - Log errors with the Logger class
   - Return appropriate HTTP status codes
   - Include error details in development, generic messages in production

5. **Validation**:
   - Always validate input data using zod schemas
   - Reuse schemas from `shared/schema.ts`

## Data Model Standards

1. **Schema Changes**:
   - Add new tables/fields in `shared/schema.ts`
   - Create validation schemas for all tables
   - Add TypeScript type exports for all new entities
   - Update the Storage interface in `server/storage.ts`
   - Create migration scripts

2. **Relationships**:
   - Teams belong to coaches (users with role "coach")
   - Players belong to teams and have a parent (users with role "parent")
   - Attendance records belong to players and teams
   - Practice notes belong to teams and coaches
   - Payments belong to players and teams

## Testing

1. **Unit Tests**:
   - Test components in isolation
   - Mock API calls and context providers
   - Test success and error paths

2. **Integration Tests**:
   - Test component interactions
   - Test API routes with mocked database

3. **Test Structure**:
   - Place tests in the `test/` directory
   - Follow naming convention: `{filename}.test.ts` or `{filename}.test.tsx`
   - Use vitest for running tests

## Performance Considerations

1. **Memoization**:
   - Use `useMemo` for expensive calculations
   - Use `useCallback` for functions passed as props
   - Use `React.memo` for components that render often but change infrequently

2. **Query Optimization**:
   - Set appropriate staleTime and cacheTime for queries
   - Use query invalidation strategically
   - Avoid fetching all data when filtering can be done on the server

3. **Bundle Size**:
   - Import only what you need from libraries
   - Use code splitting for routes
   - Lazy load heavy components

## Security Best Practices

1. **Input Validation**:
   - Validate all input on both client and server
   - Use zod schemas for validation

2. **Authentication**:
   - Use secure password storage with proper hashing
   - Implement proper session management
   - Use CSRF protection

3. **Authorization**:
   - Check permissions on all protected routes
   - Validate that users can only access data they are authorized to see

4. **Data Sanitization**:
   - Sanitize data when displaying user-generated content
   - Use parameterized queries to prevent SQL injection

## Deployment

1. **Environment Variables**:
   - Store sensitive information in environment variables
   - Never commit secrets to version control
   - Use `.env` file for local development

2. **Production Build**:
   - Use the build script in package.json
   - Test the production build locally before deployment

3. **Monitoring**:
   - Implement error logging in production
   - Monitor server performance

## Documentation

1. **Code Comments**:
   - Document complex functions and components
   - Add JSDoc comments for public APIs
   - Document database schema changes

2. **User Documentation**:
   - Keep README updated
   - Document user flows for new features 