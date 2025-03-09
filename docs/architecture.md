# Basketball Coaching Management Platform Architecture

This document provides a comprehensive overview of the architecture, business logic, and data flow of the Basketball Coaching Management Platform.

## System Architecture

The application follows a layered architecture with clear separation of concerns:

```
┌─────────────────┐
│   Client Layer  │ React components, hooks, and client-side state management
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     API Layer   │ Express routes, authentication, and request handling
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Storage Layer  │ Data access, business logic, and database operations
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Database Layer │ PostgreSQL with Drizzle ORM
└─────────────────┘
```

### Key Components

1. **Client Layer**: React-based frontend with components, hooks, and client-side state management using TanStack Query.
2. **API Layer**: Express.js routes that handle HTTP requests, authentication, and validation, organized by resource type.
3. **Storage Layer**: Business logic and data access operations implemented in the `storage.ts` file, with a clear interface.
4. **Database Layer**: PostgreSQL database with Drizzle ORM for type-safe database operations and migrations.

## Data Model

The application uses the following core entities:

### Users
- Represents coaches and other users in the system
- Has a role (Coach or Normal) that determines permissions
- All users can be members of teams with different roles
- Coaches can create and manage teams
- Normal users (parents) can view their children's information

### Teams
- Represents basketball teams
- Has a coach (creator) and team members with different roles
- Contains season dates and fee information
- Associated with players, attendance records, practice notes, and payments

### Team Members
- Represents a user's membership in a team
- Has a role (Owner, AssistantCoach, TeamManager, Regular) that determines permissions within the team
- Owners have full control over a team
- Different roles have different permissions (adding players, taking attendance, etc.)

### Players
- Represents team members (children/athletes)
- Associated with a team and a parent (user)
- Can be active or inactive
- Has basic profile information including jersey number

### Attendance
- Records player attendance at practices
- Associated with a team, player, and date
- Tracks present/absent status
- Supports date range filtering for reporting

### Practice Notes
- Records notes from practice sessions
- Associated with a team, coach, and date
- Can be associated with specific players or the entire team
- Supports rich text content for detailed observations

### Payments
- Records financial transactions
- Associated with a team and player
- Tracks amount, date, and notes
- Supports reporting and summaries by player

## Business Logic

### Authentication and Authorization

The application implements a comprehensive role-based access control system:

1. **Authentication**: Uses Passport.js with local strategy for username/password authentication
2. **Session Management**: Uses express-session with PostgreSQL session store for persistent sessions
3. **CSRF Protection**: Implements double submit cookie pattern using csrf-csrf for security
4. **Authorization Patterns**:
   - User Role Permissions: Controls what actions a user can perform (create teams, etc.)
   - Team Role Permissions: Controls what actions a user can perform within a team (add players, etc.)
   - Permission checking middleware for securing API endpoints
   - Client-side permission hooks for conditional UI rendering

### Team Management

Teams are the central organizational unit in the application:

1. **Team Creation**: Only coaches can create teams, and they automatically become the coach of the team
2. **Team Access**:
   - Coaches see teams they coach (direct relationship)
   - Parents see teams their children are on (indirect relationship through players)

### Player Management

Players have dual associations that enable different access patterns:

1. **Player Creation**:
   - Coaches can add players to teams they coach
   - Parents can add their children to teams (parentId is automatically set)
2. **Player Access**:
   - Coaches can view all players on their teams
   - Parents can only view their own children

### Attendance Tracking

Attendance tracking uses a bulk update pattern for simplicity:

1. **Recording Attendance**:
   - Coaches submit the complete state of attendance for a date
   - The system replaces all existing records for that date
2. **Date Handling**:
   - Dates are standardized to handle timezone differences
   - Date ranges can be used for filtering attendance records

### Practice Notes

Practice notes follow a single-note-per-date pattern:

1. **Note Creation/Update**:
   - If a note already exists for a team and date, it's updated
   - Otherwise, a new note is created
2. **Player Association**:
   - Notes can be associated with specific players
   - This enables filtering notes by player

### Payment Tracking

Payments are tracked with comprehensive reporting capabilities:

1. **Recording Payments**:
   - Coaches can record payments for players
   - Amount validation ensures proper financial data
2. **Reporting**:
   - Individual payment history by player
   - Team-wide payment summaries
   - Date range filtering for financial periods

## Data Flow Examples

### Team Creation Flow

1. Coach logs in (authentication)
2. Coach submits team creation form
3. API validates the request and checks authorization
4. Storage layer creates the team with the coach as owner
5. Response returns the created team to the client

### Attendance Recording Flow

1. Coach logs in (authentication)
2. Coach selects a team and date
3. Coach marks attendance for players
4. API validates the request and checks authorization
5. Storage layer:
   - Deletes any existing attendance records for that team and date
   - Creates new attendance records for each player
6. Response returns the updated attendance records

### Parent Viewing Child's Data Flow

1. Parent logs in (authentication)
2. Parent requests teams (system finds teams with their children)
3. Parent selects a team
4. Parent requests player data (system filters to show only their children)
5. Parent views attendance, practice notes, or payments for their child

## Security Considerations

The application implements several security measures:

1. **Input Validation**: All user inputs are validated using Zod schemas
2. **Authorization Checks**: Every API endpoint verifies user permissions
3. **Error Handling**: Structured error responses without exposing sensitive information
4. **Session Security**: Secure session management with proper cookie settings
5. **Data Access Control**: Users can only access data they are authorized to see

## Performance Considerations

The application is designed with performance in mind:

1. **Efficient Queries**: Database queries are optimized to fetch only necessary data
2. **Bulk Operations**: Attendance updates use bulk operations for efficiency
3. **Date Standardization**: Dates are standardized to avoid timezone issues
4. **Pagination**: Large data sets should implement pagination (future enhancement)

## Future Enhancements

Potential areas for architectural improvement:

1. **Caching**: Implement Redis caching for frequently accessed data
2. **Real-time Updates**: Add WebSocket support for live updates
3. **Microservices**: Split into microservices for better scalability
4. **API Versioning**: Implement API versioning for backward compatibility
5. **Advanced Analytics**: Add data analysis and reporting capabilities
