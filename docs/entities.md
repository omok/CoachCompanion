# Data Entities

## User (Coach)
```typescript
interface User {
  id: number;
  username: string;
  password: string; // Hashed
}
```

## Team
```typescript
interface Team {
  id: number;
  name: string;
  coachId: number;
  description: string;
}
```

## Player
```typescript
interface Player {
  id: number;
  name: string;
  teamId: number;
  parentName: string;
  phone: string;
  email: string;
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
  notes: string;
}
```

## Practice
```typescript
interface Practice {
  id: number;
  teamId: number;
  date: Date;
  notes: string;
}
```

## Attendance
```typescript
interface Attendance {
  id: number;
  practiceId: number;
  playerId: number;
  status: 'present' | 'absent' | 'late';
}
```

## Entity Relationships

- A Coach (User) can manage multiple Teams
- A Team has one Coach and multiple Players
- A Player belongs to one Team
- A Payment is associated with one Player and one Team
- A Practice belongs to one Team
- Attendance records link Players to Practices
