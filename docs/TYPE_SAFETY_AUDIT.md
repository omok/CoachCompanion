# TypeScript Type Safety Audit

This document lists all instances of `any` type usage in the codebase and provides recommendations for replacing them with proper types.

## Client-side `any` Types

### Form Handling

**player-form.tsx**
```typescript
Line 33: mutationFn: async (data: any) => {
Line 64: const onSubmit = (data: any) => {
```
**Recommendation:** Replace with the appropriate form data type using Zod schema:
```typescript
// Import zod schema
import { playerFormSchema } from "@shared/schema";
// Create type from schema
type PlayerFormData = z.infer<typeof playerFormSchema>;
// Use in mutation/handler
mutationFn: async (data: PlayerFormData) => {
```

**practice-notes.tsx**
```typescript
Line 127: mutationFn: async (data: any) => {
```
**Recommendation:** Replace with appropriate practice note form schema type.

**team-roster.tsx**
```typescript
Line 60: mutationFn: async (data: any) => {
Line 90: mutationFn: async (data: any) => {
```
**Recommendation:** Define interface for team roster mutation data.

**player-list.tsx**
```typescript
Line 81: mutationFn: async (data: any) => {
```
**Recommendation:** Define interface for player data.

### Logging

**attendance-tracker.tsx**
```typescript
Line 15: const logEvent = (component: string, action: string, data?: any) => {
Line 20: const logger = (action: string, data?: any) => logEvent('AttendanceTracker', action, data);
```
**Recommendation:** Replace with `unknown` type or define a proper interface for the log data structure.

### State Management

**useTeamMember.ts**
```typescript
Line 26: const [requestLogs, setRequestLogs] = useState<any[]>([]);
Line 27: const logRef = useRef<any[]>([]);
```
**Recommendation:** Define a `LogEntry` interface and use that instead.

**usePermissions.ts**
```typescript
Line 26: details: any
```
**Recommendation:** Define a proper error details interface.

## Server-side `any` Types

### Error Handling

**csrf.ts**
```typescript
Line 39: app.use((err: any, req: Request, res: Response, next: NextFunction) => {
```
**Recommendation:** Use the Express error handler type or define a custom error interface.

**index.ts**
```typescript
Line 57: err: any,
```
**Recommendation:** Use Express error handler type or define custom error type.

### Route Handlers

**practice-notes.ts**
```typescript
Line 50: router.post("/", requireTeamRolePermission(TEAM_PERMISSION_KEYS.ADD_PRACTICE_NOTE), async (req: any, res: Response) => {
Line 332: router.put("/:noteId", requireTeamRolePermission(TEAM_PERMISSION_KEYS.ADD_PRACTICE_NOTE), async (req: any, res: Response) => {
```
**Recommendation:** Use proper Express request typing with generic parameters:
```typescript
async (req: Request<TeamParams, any, PracticeNoteRequestBody>, res: Response)
```

### Utility Functions

**utils.ts**
```typescript
Line 54: storage: any
```
**Recommendation:** Use the `IStorage` interface.

**payments.ts**
```typescript
Line 17: function formatPaymentDatesForClient(payments: any[]) {
```
**Recommendation:** Create a Payment interface and use `Payment[]`.

**logger.ts**
```typescript
Line 4: static debug(message: string, data?: any): void {
Line 8: static info(message: string, data?: any): void {
Line 12: static warn(message: string, data?: any): void {
Line 16: static error(message: string, data?: any): void {
```
**Recommendation:** Use `unknown` type with type narrowing in the implementation.

### Type Assertions

**authorization.ts**
```typescript
Line 40: return (req.user as any).id;
Line 44: const passportSession = (req.session as any)?.passport;
```
**Recommendation:** Define proper interfaces for user and session.

**RouteRegistry.ts**
```typescript
Line 29: const stack = (app._router?.stack || []) as any[];
```
**Recommendation:** Define an interface for Express router stack items.

**index.ts**
```typescript
Line 41: const sessionData = req.session as any;
```
**Recommendation:** Use `Session` type from express-session.

**team-members.ts**
```typescript
Line 27: const userId = req.session.userId || (req.user ? (req.user as any).id : null) ||
Line 28: (req.session as any)?.passport?.user;
```
**Recommendation:** Define proper interfaces for user and session.

## Action Plan

1. Define missing interfaces for common data structures
2. Replace `any` with proper types systematically, starting with:
   - Form data types in client components
   - Request/response types in API routes
   - Error handling types in middleware
3. For logging and debugging, consider using `unknown` with type narrowing
4. Create custom type definitions for third-party libraries where needed

The goal is to eliminate all `any` type usage to improve type safety, code quality, and developer experience. 