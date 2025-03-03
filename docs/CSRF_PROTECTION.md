# CSRF Protection in CoachCompanion

## Overview

Cross-Site Request Forgery (CSRF) is an attack that forces authenticated users to submit a request to a web application against which they are currently authenticated. CoachCompanion implements protection against CSRF attacks using the `csrf-csrf` package.

## Implementation Details

### Server-Side Implementation

CSRF protection is implemented in `server/csrf.ts` using the `doubleCsrf` function from the `csrf-csrf` package. This provides double submit cookie pattern protection, which is a robust approach to CSRF defense.

Key features:
- Double submit cookie pattern
- Token validation for non-safe methods (POST, PUT, DELETE, etc.)
- Automatic token refreshing
- Custom error handling

### Client-Side Implementation

The client-side code in `client/src/lib/queryClient.ts` automatically:
1. Fetches a CSRF token from the `/api/csrf-token` endpoint
2. Caches the token in memory
3. Includes the token in all non-GET/HEAD/OPTIONS requests as a header
4. Handles token refresh on validation failures

## How It Works

1. When the user first loads the application, a CSRF token is generated and set as an HTTP-only cookie.
2. When the user makes a non-safe request (like POST or PUT), the client fetches a corresponding CSRF token from the server and includes it as a header.
3. The server validates that the token in the header matches the expected value based on the cookie.
4. If validation fails, the request is rejected with a 403 Forbidden response.

## Usage

For developers using or extending CoachCompanion, CSRF protection is automatically applied to all non-safe HTTP methods. You don't need to manually include CSRF tokens as the `apiRequest` function in `client/src/lib/queryClient.ts` handles this for you.

### Example Use in Components

```typescript
import { apiRequest } from "@/lib/queryClient";

// In a mutation function
const createItem = async (data) => {
  const res = await apiRequest("POST", "/api/items", data);
  if (!res.ok) {
    throw new Error("Failed to create item");
  }
  return await res.json();
};
```

## Troubleshooting

If you encounter CSRF validation errors:

1. Check if cookies are being properly sent with requests (credentials: 'include')
2. Ensure the CSRF token header is being included in non-GET requests
3. Verify that the user's session hasn't expired 
4. Try refreshing the page to get a new CSRF token

## Security Considerations

- The CSRF token is stored in an HTTP-only cookie to prevent access by JavaScript
- The validation secret is derived from the session secret for additional security
- In production, the cookie is set with secure and sameSite attributes for enhanced protection 