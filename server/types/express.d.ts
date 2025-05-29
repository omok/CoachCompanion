// server/types/express.d.ts

// Define a minimal interface for the authenticated user
interface AuthenticatedUser {
  id: number;
  // Add other properties if available and used, e.g., role, email
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Export AuthenticatedUser if it needs to be imported elsewhere,
// though for augmenting Express.Request, it's often not explicitly exported
// if only used within this d.ts file's scope for the augmentation.
// However, making it available can be useful.
export { AuthenticatedUser };
