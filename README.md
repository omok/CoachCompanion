# Basketball Coaching Management Platform

A comprehensive web application designed to streamline basketball team operations and enhance coaching efficiency through intelligent technology.

## Features

- 🏀 **Team Management**
  - Create and manage multiple teams
  - Track player rosters and attendance
  - Organize practice sessions

- 📝 **Practice Notes System**
  - Record and track practice attendance
  - Create detailed session notes
  - Monitor player progress

- 💰 **Payment Tracking**
  - Track player payments
  - Generate payment reports
  - Monitor payment totals

- 📊 **Performance Analytics**
  - Track player statistics
  - Generate performance reports
  - Monitor team progress

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Express.js
- **Database**: PostgreSQL
- **Authentication**: Passport.js
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **ORM**: Drizzle

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```env
   DATABASE_URL=your_postgresql_database_url
   ```
4. Run database migrations:
   ```bash
   npm run db:push
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`.

## Development

For detailed information about the application architecture, database schema, and API endpoints, please refer to the documentation in the [docs](./docs) directory.

## License

MIT
