# API Documentation

## Authentication

### POST /api/auth/login
Login with username and password
```typescript
Request:
{
  username: string;
  password: string;
}
Response:
{
  id: number;
  username: string;
}
```

### POST /api/auth/logout
Logout current user
```typescript
Response: 200 OK
```

### GET /api/user
Get current user information
```typescript
Response:
{
  id: number;
  username: string;
}
```

## Teams

### GET /api/teams
Get all teams for the current coach
```typescript
Response: Team[]
```

### POST /api/teams
Create a new team
```typescript
Request:
{
  name: string;
  description: string;
}
Response: Team
```

### GET /api/teams/:teamId/players
Get all players in a team
```typescript
Response: Player[]
```

### POST /api/teams/:teamId/players
Add a new player to a team
```typescript
Request:
{
  name: string;
  parentName: string;
  phone: string;
  email: string;
}
Response: Player
```

## Payments

### GET /api/teams/:teamId/payments
Get all payments for a team
```typescript
Response: Payment[]
```

### POST /api/teams/:teamId/payments
Record a new payment
```typescript
Request:
{
  playerId: number;
  amount: number;
  notes: string;
}
Response: Payment
```

### GET /api/teams/:teamId/payments/totals
Get payment totals by player
```typescript
Response: {
  playerId: number;
  total: number;
}[]
```

## Practice Management

### GET /api/teams/:teamId/practices
Get all practices for a team
```typescript
Response: Practice[]
```

### POST /api/teams/:teamId/practices
Create a new practice session
```typescript
Request:
{
  date: string;
  notes: string;
}
Response: Practice
```

### POST /api/teams/:teamId/practices/:practiceId/attendance
Record attendance for a practice
```typescript
Request:
{
  playerId: number;
  status: 'present' | 'absent' | 'late';
}
Response: Attendance
```

## Response Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error
