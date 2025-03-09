# CoachCompanion: Basketball Coaching Management Platform

A comprehensive web application designed to streamline basketball team operations and enhance coaching efficiency through intelligent technology, built with security, data integrity, and user experience in mind.

## Features

- 🏀 **Team Management**
  - Create and manage multiple teams with seasonal data
  - Define team roles (Owner, AssistantCoach, TeamManager, Regular)
  - Flexible permission system for different team members
  - Complete roster management with player profiles

- 📝 **Practice Management**
  - Record and track practice attendance with reporting
  - Create detailed practice notes with player-specific observations
  - Filter practice data by date ranges
  - Document player development over time

- 💰 **Payment Tracking**
  - Record player payments with audit trail
  - Generate payment reports with totals by player
  - Filter payment history by date ranges
  - Track outstanding balances

- 👥 **User and Permission System**
  - Role-based access control (Coach and Normal/Parent roles)
  - Team-level permission management
  - Secure authentication with session management
  - Comprehensive CSRF protection

## Architecture

CoachCompanion follows a layered architecture with clear separation of concerns:

- **Client Layer**: React frontend with TanStack Query for state management
- **API Layer**: Express.js RESTful API with resource-based routing
- **Storage Layer**: Business logic and data access with a clean interface
- **Database Layer**: PostgreSQL with Drizzle ORM for type-safe operations

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Express.js
- **Database**: PostgreSQL
- **Authentication**: Passport.js with session management
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **ORM**: Drizzle
- **Security**: CSRF protection with csrf-csrf package

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```env
   DATABASE_URL=your_postgresql_database_url
   SESSION_SECRET=your_secure_random_string
   PORT=5000
   ```
4. Run database migrations:
   ```bash
   npm run db:push
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000` (or the port you specified).

## Development Guidelines

CoachCompanion follows strict development guidelines to ensure code quality and maintainability:

- **TypeScript**: Strict typing throughout the codebase with no use of `any`
- **Modular Design**: Clear separation of concerns with focused components
- **Permission Controls**: Two-tiered permission system (user roles and team roles)
- **Audit Trail**: All data changes are tracked with user attribution
- **Testing**: Comprehensive test coverage for components and business logic

For detailed information about coding standards, please refer to:
- [Cursor Rules](./docs/CURSOR_RULES.md): Coding standards and patterns
- [Best Practices](./docs/BEST_PRACTICES.md): Observed best practices in the codebase

## Documentation

The project includes comprehensive documentation in the [docs](./docs) directory:

- [API Documentation](./docs/api.md): Detailed API endpoint reference
- [Architecture](./docs/architecture.md): System architecture and data flow
- [Entities](./docs/entities.md): Data model and entity relationships
- [Permissions System](./docs/permissions-system.md): Role-based access control
- [Implementation Roadmap](./docs/implementation-roadmap.md): Feature implementation plan

## License

MIT
