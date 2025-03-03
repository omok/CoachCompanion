/**
 * Team membership record representing a user's association with a team
 */
export interface TeamMembership {
  /** The team's unique identifier */
  teamId: number;
  /** The user's unique identifier */
  userId: number;
  /** The user's role in the team (owner, coach, assistant) */
  role: 'owner' | 'coach' | 'assistant';
  /** The team's name (optional, included for convenience) */
  teamName?: string;
}

/**
 * User record from the database
 */
export interface User {
  /** The user's unique identifier */
  id: number;
  /** The user's email address */
  email: string;
  /** The user's first name */
  firstName: string;
  /** The user's last name */
  lastName: string;
  /** Whether the user's email has been verified */
  emailVerified?: boolean;
}

/**
 * Team record from the database
 */
export interface Team {
  /** The team's unique identifier */
  id: number;
  /** The team's name */
  name: string;
  /** The coach's unique identifier */
  coachId: number;
  /** The team's description */
  description?: string;
  /** The start date of the team's season */
  seasonStartDate?: Date;
  /** The end date of the team's season */
  seasonEndDate?: Date;
  /** The team's fee */
  teamFee?: number;
} 