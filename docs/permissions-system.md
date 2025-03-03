# Permissions System

This document describes the permissions system implemented in CoachCompanion.

## Overview

The permissions system is based on two key concepts:
1. **User Types** - The role of the user in the system (Coach or Parent)
2. **Team Roles** - The role of a user within a specific team (Owner, AssistantCoach, TeamManager, Parent)

## Implementation

The permission system follows a "single source of truth" approach:

### 1. Core Configuration (Single Source of Truth)

The permissions are defined in a single, self-documenting file: `shared/access-control.ts`. This file contains:

- Type definitions for UserType and TeamRole
- Interface definitions for permissions
- Permission configuration objects with embedded documentation
- Helper functions for permission checks

This structured approach makes permissions:
- **Easy to update**: Change permissions by editing a single configuration object
- **Type-safe**: TypeScript ensures proper permission names and values
- **Self-documenting**: Tables embedded in comments show the permission matrix

### 2. Backend Authorization Layer

The backend enforces permissions through middleware functions in `server/utils/authorization.ts`:

- `requireUserTypePermission`: Checks if a user's type has a specific permission
- `requireTeamRolePermission`: Checks if a user's role in a team has a specific permission

Example usage:

```typescript
// Only coaches can create teams
router.post('/teams', requireUserTypePermission('createNewTeam'), async (req, res) => {
  // Route implementation
});

// Only team members with addPlayer permission can add players
router.post('/teams/:teamId/players', requireTeamRolePermission('teamId', 'addPlayer'), async (req, res) => {
  // Route implementation
});
```

### 3. Frontend Authorization Layer

The frontend respects permissions through a React hook in `client/src/hooks/usePermissions.ts`:

- `hasUserTypePermission`: Checks if the current user's type has a permission
- `hasTeamRolePermission`: Checks if the current user's role in a team has a permission
- Convenience methods for common permission checks

Example usage:

```tsx
function TeamDetails({ teamId }) {
  const { canAddPlayer, canManagePayments } = usePermissions();
  
  return (
    <div>
      {canAddPlayer(teamId) && <AddPlayerButton />}
      {canManagePayments(teamId) && <PaymentsSection />}
    </div>
  );
}
```

## Permission Reference

For the current permission configuration, refer to the comments in `shared/access-control.ts`, which includes:

### User Type Permissions

```
| Permission                 | Coach | Parent |
---------------------------------------------------------
| createNewTeam              |   ✓   |   ✗    |
| canBeInvitedAsAssistantCoach |   ✓   |   ✗    |
```

### Team Role Permissions

```
| Permission        | Owner | AssistantCoach | TeamManager | Parent |
------------------------------------------------------------------------------------
| seeTeamRoster     |   ✓   |       ✓        |      ✓      |   ✓    |
| addPlayer         |   ✓   |       ✓        |      ✓      |   ✗    |
| takeAttendance    |   ✓   |       ✓        |      ✓      |   ✗    |
| addPracticeNote   |   ✓   |       ✓        |      ✗      |   ✗    |
| managePayments    |   ✓   |       ✗        |      ✓      |   ✗    |
| inviteTeamMembers |   ✓   |       ✗        |      ✗      |   ✗    |
| removeTeamMembers |   ✓   |       ✗        |      ✗      |   ✗    |
| deleteTeam        |   ✓   |       ✗        |      ✗      |   ✗    |
```

## Updating Permissions

To update permissions:

1. Edit **ONLY** the configuration objects in `shared/access-control.ts`
2. The changes will automatically apply throughout the application

Example:
```typescript
// To allow AssistantCoach to manage payments:
export const teamRolePermissions: Record<TeamRole, TeamRolePermissions> = {
  // ...existing permissions
  AssistantCoach: {
    // ...other permissions
    managePayments: true, // Changed from false to true
  },
  // ...other roles
};
```

## Benefits of This Approach

1. **Single Source of Truth**: Permissions are defined once in a self-documenting format
2. **No Redundancy**: No need to update multiple files when permissions change
3. **Type Safety**: TypeScript ensures correct permission names and prevents errors
4. **Easy Maintenance**: Changing permissions requires editing one file only
5. **Self-Documenting Code**: The TypeScript file itself contains readable permission tables 