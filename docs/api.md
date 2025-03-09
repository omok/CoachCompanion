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
  name: string;
  role: string;
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
  name: string;
  role: string;
}
```

### PUT /api/user/profile
Update user profile
```typescript
Request:
{
  id: number;
  name: string;
  username: string;
  password?: string; // Optional, only if changing password
  role: string;
}
Response:
{
  id: number;
  username: string;
  name: string;
  role: string;
}
```

## Teams

### GET /api/teams
Get all teams for the current user
```typescript
Response: Team[]
```

### POST /api/teams
Create a new team
```typescript
Request:
{
  name: string;
  description?: string;
  seasonStartDate?: string; // YYYY-MM-DD format
  seasonEndDate?: string; // YYYY-MM-DD format
  teamFee?: string; // Numeric string, will be parsed to number
}
Response: Team
```

### GET /api/user/teams
Get all teams that the current user is a member of
```typescript
Response: {
  id: number;
  teamId: number;
  name: string;
  description: string;
  role: string;
  isOwner: boolean;
}[]
```

## Team Members

### GET /api/teams/:teamId/members
Get all members of a team
```typescript
Response: {
  id: number;
  teamId: number;
  userId: number;
  role: string;
  isOwner: boolean;
  userName: string;
}[]
```

### POST /api/teams/:teamId/members
Add a new member to a team
```typescript
Request:
{
  userId: number;
  role: string; // "Owner", "AssistantCoach", "TeamManager", "Regular"
  isOwner?: boolean;
}
Response: TeamMember
```

### PUT /api/teams/:teamId/members/:memberId
Update a team member's role
```typescript
Request:
{
  role: string;
  isOwner?: boolean;
}
Response: TeamMember
```

### DELETE /api/teams/:teamId/members/:memberId
Remove a member from a team
```typescript
Response: 200 OK
```

## Players

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
  parentId: number;
  active?: boolean;
  jerseyNumber?: string;
}
Response: Player
```

### PUT /api/teams/:teamId/players/:playerId
Update a player
```typescript
Request:
{
  name: string;
  parentId: number;
  active?: boolean;
  jerseyNumber?: string;
}
Response: Player
```

### DELETE /api/teams/:teamId/players/:playerId
Remove a player from a team
```typescript
Response: 200 OK
```

## Attendance

### GET /api/teams/:teamId/attendance
Get attendance records for a team, optionally filtered by date range
```typescript
Query Parameters:
startDate?: string; // YYYY-MM-DD format
endDate?: string; // YYYY-MM-DD format

Response: Attendance[]
```

### POST /api/teams/:teamId/attendance
Record attendance for multiple players
```typescript
Request:
{
  date: string; // YYYY-MM-DD format
  records: {
    playerId: number;
    present: boolean;
  }[];
}
Response: Attendance[]
```

### GET /api/teams/:teamId/attendance/players/:playerId
Get attendance records for a specific player
```typescript
Query Parameters:
startDate?: string; // YYYY-MM-DD format
endDate?: string; // YYYY-MM-DD format

Response: Attendance[]
```

## Practice Notes

### GET /api/teams/:teamId/practice-notes
Get practice notes for a team, optionally filtered by date range
```typescript
Query Parameters:
startDate?: string; // YYYY-MM-DD format
endDate?: string; // YYYY-MM-DD format

Response: PracticeNote[]
```

### POST /api/teams/:teamId/practice-notes
Create a practice note
```typescript
Request:
{
  teamId: number;
  coachId: number;
  practiceDate: string; // YYYY-MM-DD format
  notes: string;
  playerIds?: number[];
}
Response: PracticeNote
```

### PUT /api/teams/:teamId/practice-notes/:noteId
Update a practice note
```typescript
Request:
{
  notes: string;
  playerIds?: number[];
}
Response: PracticeNote
```

### DELETE /api/teams/:teamId/practice-notes/:noteId
Delete a practice note
```typescript
Response: 200 OK
```

### GET /api/teams/:teamId/practice-notes/players/:playerId
Get practice notes for a specific player
```typescript
Query Parameters:
startDate?: string; // YYYY-MM-DD format
endDate?: string; // YYYY-MM-DD format

Response: PracticeNote[]
```

## Payments

### GET /api/teams/:teamId/payments
Get all payments for a team, optionally filtered by date range
```typescript
Query Parameters:
startDate?: string; // YYYY-MM-DD format
endDate?: string; // YYYY-MM-DD format

Response: Payment[]
```

### POST /api/teams/:teamId/payments
Record a new payment
```typescript
Request:
{
  playerId: number;
  amount: string; // Numeric string, will be parsed to number
  date: string; // YYYY-MM-DD format
  notes?: string;
}
Response: Payment
```

### GET /api/teams/:teamId/payments/totals
Get payment totals by player
```typescript
Response: {
  playerId: number;
  name: string;
  total: string; // String representation of numeric value
}[]
```

### GET /api/teams/:teamId/payments/players/:playerId
Get payments for a specific player
```typescript
Query Parameters:
startDate?: string; // YYYY-MM-DD format
endDate?: string; // YYYY-MM-DD format

Response: Payment[]
```

## Response Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error
