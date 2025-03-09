# Data Entities

## User
```typescript
interface User {
  id: number;
  username: string;
  password: string; // Hashed
  role: string; // "Coach" or "Normal"
  name: string;
  lastUpdatedByUser: number;
}
```

## Team
```typescript
interface Team {
  id: number;
  name: string;
  coachId: number;
  description?: string;
  seasonStartDate?: Date;
  seasonEndDate?: Date;
  teamFee?: number;
  lastUpdatedByUser: number;
}
```

## Team Member
```typescript
interface TeamMember {
  id: number;
  teamId: number;
  userId: number;
  role: string; // "Owner", "AssistantCoach", "TeamManager", "Regular"
  isOwner: boolean;
  lastUpdatedByUser: number;
}
```

## Player
```typescript
interface Player {
  id: number;
  name: string;
  teamId: number;
  parentId: number;
  active: boolean;
  jerseyNumber?: string;
  lastUpdatedByUser: number;
}
```

## Attendance
```typescript
interface Attendance {
  id: number;
  playerId: number;
  teamId: number;
  date: Date;
  present: boolean;
  lastUpdatedByUser: number;
}
```

## Practice Note
```typescript
interface PracticeNote {
  id: number;
  teamId: number;
  coachId: number;
  practiceDate: Date;
  notes: string;
  playerIds?: number[];
  lastUpdatedByUser: number;
}
```

## Payment
```typescript
interface Payment {
  id: number;
  playerId: number;
  teamId: number;
  amount: number;
  date: Date;
  notes?: string;
  lastUpdatedByUser: number;
}
```

## Entity Relationships

- Users can have different roles (Coach or Normal/Parent)
- Users can be members of multiple teams with different roles (Owner, AssistantCoach, TeamManager, Regular)
- A Team can have multiple TeamMembers with different roles
- A Player belongs to one Team and has one Parent (User)
- Attendance records are associated with Players and Teams for specific dates
- Practice Notes are associated with Teams and can optionally be linked to specific Players
- Payments are associated with Players and Teams

## Audit Trail

All entity tables include a `lastUpdatedByUser` column that references the User ID who last modified the record. This provides a complete audit trail of data changes throughout the system.
