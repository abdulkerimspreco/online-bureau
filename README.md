# Online Bureau

GitHub repository: [abdulkerimspreco/online-bureau](https://github.com/abdulkerimspreco/online-bureau)

Online Bureau is a software engineering project for matching employers with job seekers through searchable CVs, profile management, and controlled candidate discovery workflows.

## Current Milestone Scope

This repository currently includes the initial customer-side release for Milestone 2:

- authentication and session management
- email verification flow
- password reset flow
- account lockout after repeated failed login attempts
- job seeker profile management
- CV upload, replacement, deletion, and visibility controls
- CV tag management
- employer profile management
- employer candidate search over visible CVs

The application is not yet the complete final system, but it already demonstrates working core flows across both frontend and backend.

## Project Structure

### Monorepo

- `apps/backend` - NestJS backend API
- `apps/frontend` - React + Vite frontend
- `packages/types` - shared TypeScript types
- `docs` - repository documentation assets

### Backend Technologies

- NestJS
- Prisma ORM
- PostgreSQL
- JWT authentication
- Passport
- Multer for CV uploads

### Frontend Technologies

- React
- Vite
- TypeScript
- React Router
- Axios
- Tailwind CSS

### Database Entities

The current database schema centers around these entities:

- `User`
- `JobSeekerProfile`
- `EmployerProfile`
- `Cv`
- `Tag`
- `CVTag`

ER diagram:

- [ER Diagram (SVG)](/Users/devchospre/Documents/online-bureau/docs/er-diagram.svg)

### External API Integration

There is currently no external third-party API integration in the project. Communication between frontend and backend is handled through REST APIs exposed by the NestJS backend.

## Initial Release Features

### Authentication

- job seeker registration
- employer registration
- login and logout
- authenticated session lookup
- email verification
- password reset request and completion
- failed login tracking and temporary lockout

### Job Seeker Workflows

- dashboard
- profile editing
- preferred categories management
- CV upload and visibility management
- CV tag attachment and removal

### Employer Workflows

- dashboard
- company profile editing
- candidate search by keyword, location, and tag

## Local Development

### Requirements

- Node.js
- pnpm
- PostgreSQL

### Install dependencies

```bash
pnpm install
```

### Backend

```bash
cd apps/backend
npm run prisma:migrate:dev
npm run start:dev
```

### Frontend

```bash
cd apps/frontend
npm run dev
```

## Notes

- Uploaded CV files are stored locally in the backend uploads directory for the current milestone implementation.
- The repository is being delivered incrementally through smaller feature branches and pull requests.
