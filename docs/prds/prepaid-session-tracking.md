# Prepaid Session Tracking System

## Overview

The Prepaid Session Tracking System will enable coaches to effectively manage prepaid training packages for players. This feature will track the number of sessions purchased, used, and remaining for each player, automatically decrement sessions when attendance is marked, and provide notifications when players are running low on sessions.

## Business Value

- **Revenue Management**: Helps coaches track prepaid revenue and plan for future income
- **Client Retention**: Timely notifications about low session balances prevent interruptions in training
- **Administrative Efficiency**: Reduces manual tracking of sessions and eliminates awkward conversations about payment
- **Financial Transparency**: Provides clear visibility into session usage for both coaches and parents

## User Personas

### Coach Jordan
- Runs a basketball training business with 30+ players
- Offers prepaid packages of 5, 10, and 20 sessions
- Needs to know when players are running low on sessions to prompt renewals
- Wants to avoid awkward payment conversations during practice

### Parent Maria
- Has two children in basketball training
- Purchases 10-session packages for each child
- Wants to know how many sessions remain before needing to purchase more
- Prefers to pay in advance rather than per session

## Feature Requirements

### Core Functionality

1. **Session Package Management**
   - Create different session package types (e.g., 5, 10, 20 sessions)
   - Record purchase of session packages for players
   - Set package expiration dates (optional)
   - Apply different pricing tiers for different package sizes

2. **Session Tracking**
   - Automatically decrement remaining sessions when attendance is marked
   - Display remaining session count for each player
   - Prevent marking attendance when no sessions remain (with override option)
   - Support manual adjustment of session counts when needed

3. **Notification System**
   - Alert coaches when players have 5 or fewer sessions remaining
   - Provide configurable thresholds for low session warnings
   - Include session status in automated communications to parents
   - Generate renewal reminders for packages nearing expiration

4. **Reporting and Analytics**
   - Show session usage trends over time
   - Calculate average sessions used per week/month
   - Project when players will run out of sessions based on attendance patterns
   - Generate reports of all players with low session counts

## Detailed Use Cases

### Use Case 1: Recording a New Session Package Purchase

**Primary Actor**: Coach  
**Preconditions**: Player exists in the system  
**Postconditions**: Player has prepaid sessions available

**Main Flow**:
1. Coach navigates to the player's profile or payment section
2. Coach selects "Add Session Package"
3. Coach selects package type (e.g., 10 sessions)
4. Coach enters payment amount and date
5. Coach adds any relevant notes
6. System records the payment and adds sessions to player's balance
7. System displays updated session count for the player

**Alternative Flows**:
- If player already has remaining sessions, coach can choose to add to existing balance or replace it
- Coach can apply a discount to the standard package price if needed

### Use Case 2: Automatic Session Deduction During Attendance

**Primary Actor**: Coach  
**Preconditions**: Player has prepaid sessions available  
**Postconditions**: Player's session count is decremented

**Main Flow**:
1. Coach navigates to attendance tracking for a practice
2. Coach marks player as present
3. System checks if player is on a prepaid session plan
4. System automatically decrements one session from player's balance
5. System displays updated session count
6. If session count reaches threshold, system generates notification

**Alternative Flows**:
- If player has no sessions remaining, system warns coach and requires confirmation
- Coach can choose to mark attendance without using a session (special event)
- If multiple sessions occur on same day, coach can specify how many to deduct

### Use Case 3: Low Session Balance Notification

**Primary Actor**: System  
**Preconditions**: Player's session count falls below threshold  
**Postconditions**: Coach is notified of low session balance

**Main Flow**:
1. After attendance is recorded, system checks player's remaining session count
2. If count falls below threshold (default: 5), system generates notification
3. Notification appears in coach's dashboard
4. Notification includes player name, remaining sessions, and quick action to record new package
5. Coach can dismiss or act on notification

**Alternative Flows**:
- Coach can configure different thresholds for different players or package types
- System can send email notification in addition to in-app notification
- Coach can schedule an automated message to parent about low session balance

### Use Case 4: Viewing Session Balances for All Players

**Primary Actor**: Coach  
**Preconditions**: None  
**Postconditions**: None

**Main Flow**:
1. Coach navigates to "Session Balances" view
2. System displays list of all players with prepaid sessions
3. For each player, system shows:
   - Total sessions purchased
   - Sessions used
   - Sessions remaining
   - Date of last session
   - Estimated date when sessions will be depleted
4. Coach can sort by remaining sessions (ascending/descending)
5. Coach can filter to show only players with low balances

**Alternative Flows**:
- Coach can export session balance report to CSV
- Coach can view historical session purchase data
- Coach can view session usage trends over time

### Use Case 5: Manual Session Balance Adjustment

**Primary Actor**: Coach  
**Preconditions**: Player exists in the system  
**Postconditions**: Player's session balance is adjusted

**Main Flow**:
1. Coach navigates to player's profile
2. Coach selects "Adjust Session Balance"
3. Coach enters adjustment amount (positive or negative)
4. Coach provides reason for adjustment
5. System updates session balance
6. System records adjustment in audit log

**Alternative Flows**:
- Coach can void a previous session deduction if recorded in error
- Coach can add bonus sessions without recording payment
- Coach can transfer sessions between siblings with parent approval

## UI Requirements

### Session Package Purchase Interface
- Package selection dropdown or cards
- Payment amount field with suggested price based on package
- Date picker for payment date
- Notes field
- Confirmation button

### Attendance Tracking Enhancement
- Display current session count next to each player
- Visual indicator for low session balances
- Confirmation dialog when marking attendance for player with zero sessions

### Session Balance Dashboard
- Sortable table of all players with session information
- Visual indicators for low balances (color coding)
- Quick action buttons for adding packages
- Filtering options

### Player Profile Session Section
- Graph showing session usage over time
- History of package purchases
- Adjustment log
- Projected depletion date

## Technical Requirements

### Database Changes
- New `session_packages` table to track package purchases
- New `session_balances` table to track current balances
- New `session_adjustments` table to track manual changes
- Relationship to existing `players` and `payments` tables

### API Endpoints
- `POST /api/teams/:teamId/players/:playerId/session-packages` - Record new package purchase
- `GET /api/teams/:teamId/players/:playerId/session-balance` - Get current balance
- `GET /api/teams/:teamId/session-balances` - Get all player balances
- `PUT /api/teams/:teamId/players/:playerId/session-balance` - Adjust balance
- `GET /api/teams/:teamId/session-balances/low` - Get players with low balances

### Integration Points
- Integrate with attendance tracking system
- Integrate with payment recording system
- Integrate with notification system
- Integrate with reporting system

## Implementation Considerations

- Ensure data consistency between payments, attendance, and session tracking
- Implement proper validation to prevent negative session balances
- Create migration path for teams currently using fixed fee model
- Design for scalability to handle teams with large player rosters
- Implement comprehensive audit logging for all session balance changes

## Success Metrics

- Reduction in payment tracking administrative time
- Increase in timely package renewals
- Reduction in "forgotten payment" situations
- User satisfaction with session tracking accuracy
- Adoption rate of prepaid session model vs. fixed fee model
