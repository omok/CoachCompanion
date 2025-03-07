import { TEAM_ROLES, type TeamRole } from '@shared/constants';
import { Logger } from '../logger';

/**
 * Check if a role string is a valid team role
 * 
 * @param role - The role string to validate
 * @returns True if the role is valid, false otherwise
 */
export function isValidTeamRole(role: string): boolean {
  return Object.values(TEAM_ROLES).includes(role as any);
}

/**
 * Get a suggested correct team role for a potentially invalid role
 * 
 * This helps catch typos in role names by finding the closest match
 * 
 * @param role - The potentially invalid role string
 * @returns A suggested valid role or the original if no close match
 */
export function getSuggestedTeamRole(role: string): string {
  // If already valid, return as is
  if (isValidTeamRole(role)) {
    return role;
  }
  
  // Find closest match using string similarity
  const validRoles = Object.values(TEAM_ROLES);
  let bestMatch = role;
  let highestSimilarity = 0;
  
  for (const validRole of validRoles) {
    const similarity = calculateStringSimilarity(role, validRole);
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = validRole;
    }
  }
  
  // Only return a suggestion if it's reasonably close
  return highestSimilarity > 0.7 ? bestMatch : role;
}

/**
 * Calculates the similarity between two strings
 * 
 * @param str1 - The first string
 * @param str2 - The second string
 * @returns A similarity score between 0 and 1
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  // Simple algorithm: count matching characters at the start
  let matchingChars = 0;
  const minLength = Math.min(str1.length, str2.length);
  
  for (let i = 0; i < minLength; i++) {
    if (str1[i].toLowerCase() === str2[i].toLowerCase()) {
      matchingChars++;
    } else {
      break; // Stop at first mismatch
    }
  }
  
  // Consider it a good match if at least half of characters match
  const score = matchingChars / str2.length;
  return score;
} 