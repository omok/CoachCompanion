# Application Architecture

## Overview

The Basketball Coaching Management Platform follows a modern full-stack architecture with clear separation of concerns:

```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions and configurations
│   │   └── pages/       # Route-based page components
├── server/              # Backend Express application
│   ├── auth.ts         # Authentication logic
│   ├── routes.ts       # API route handlers
│   └── storage.ts      # Database operations
└── shared/             # Shared types and schemas
    └── schema.ts       # Database and validation schemas
```

## Frontend Architecture

- **Component Structure**: Follows atomic design principles with shared UI components
- **State Management**: Uses TanStack Query for server state and local state management
- **Routing**: Implements wouter for lightweight client-side routing
- **Form Handling**: Utilizes React Hook Form with Zod validation
- **API Integration**: Centralized API client with type-safe requests

## Backend Architecture

- **API Layer**: RESTful API endpoints using Express.js
- **Authentication**: Session-based authentication using Passport.js
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Validation**: Request validation using Zod schemas

## Data Flow

1. Client makes API request using TanStack Query
2. Express route handler receives request
3. Request is validated using Zod schemas
4. Database operation is performed using Drizzle ORM
5. Response is sent back to client
6. TanStack Query caches the response

## Security Features

- Session-based authentication
- CSRF protection
- Input validation
- Secure password hashing
- Type-safe database operations
