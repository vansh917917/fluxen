# Fluxen Project Specification

## 1. Project Overview

Project Name: Fluxen  
Project Type: Full-Stack Web Application  
Category: Task Management  
Purpose: A simple, practical project to demonstrate full-stack web development skills.

Fluxen is a task management web application where users can register, log in, and manage their personal tasks through a clean, straightforward interface.

Fluxen is an independent project. It has no connection to FinOS and must not inherit FinOS's features, architecture, or business concept.

The primary goal is to build a complete, functional application with a frontend, backend, database, authentication, and CRUD operations while keeping the project simple and maintainable.

## 2. Core Features

Fluxen includes only the following essential features:

* User registration and login.
* Secure logout.
* Personal task dashboard.
* Create new tasks.
* View all personal tasks.
* Edit task titles and descriptions.
* Mark tasks as completed or pending.
* Delete tasks.
* Filter tasks by All, Pending, and Completed.
* Responsive interface for desktop and mobile.
* Basic loading, validation, empty, and error states.

Avoid unnecessary features such as AI integration, payment systems, team collaboration, chat, notifications, advanced analytics, or complex integrations.

## 3. Technology Stack

### Frontend
* React
* TypeScript
* Vite
* Tailwind CSS

### Backend
* Node.js
* Express.js
* TypeScript
* REST API architecture

### Database
* PostgreSQL
* Prisma ORM

### Authentication
* Secure session-based or token-based authentication mechanism using httpOnly cookies.
* Password hashing with bcrypt.
* Server-side authentication and authorization checks.

### Development Tools
* Git and GitHub
* npm
* Environment variables for configuration
* VS Code or another code editor

Keep the stack simple. Do not introduce additional technologies unless they solve a genuine project requirement.

## 4. Application Workflow

* A visitor opens Fluxen.
* The visitor registers or logs in.
* The application displays the user's task dashboard.
* The user creates, edits, completes, filters, or deletes tasks.
* Changes are stored in PostgreSQL.
* The user can refresh the page and still see their saved tasks.
* The user can log out securely.

Each user must only be able to access and manage their own tasks.

## 5. Database Design

### User
* `id`: Unique identifier (UUID or CUID / integer).
* `email`: Unique email address.
* `passwordHash`: Hashed password.
* `createdAt`: Account creation timestamp.

### Task
* `id`: Unique identifier.
* `userId`: Identifier of the task owner.
* `title`: Required task title.
* `description`: Optional task description.
* `completed`: Boolean indicating completion status.
* `createdAt`: Task creation timestamp.
* `updatedAt`: Last update timestamp.

A user can have multiple tasks. Each task must belong to one user.
The backend must determine task ownership from the authenticated session, not trust a user ID supplied by the client.

## 6. Backend API

### Authentication Endpoints
* `POST /api/auth/register` : Register a new user.
* `POST /api/auth/login` : Authenticate a user.
* `POST /api/auth/logout` : End the user's session.
* `GET /api/auth/me` : Return the currently authenticated user's information.

### Task Endpoints
* `GET /api/tasks` : Retrieve the authenticated user's tasks.
* `POST /api/tasks` : Create a task.
* `GET /api/tasks/:id` : Retrieve a specific task.
* `PATCH /api/tasks/:id` : Update a task.
* `DELETE /api/tasks/:id` : Delete a task.

All task endpoints must require authentication and enforce ownership. Request data must be validated, and the API must return appropriate HTTP status codes and understandable error messages.

## 7. Frontend Pages

### Landing Page
A simple introduction to Fluxen with a clear option to register or log in.

### Registration Page
A form for creating an account, with basic validation and error messages.

### Login Page
A form for authenticating existing users.

### Dashboard
The main application page containing:
* A clear page heading.
* A button to create a task.
* A list of tasks.
* Completion controls.
* Edit and delete actions.
* Filters for all, pending, and completed tasks.
* A logout option.

### Task Form
A small form for entering or editing a task title and optional description.

The interface should be clean, responsive, accessible, and easy to understand. Prioritize functionality over elaborate animations or complicated visual effects.

## 8. Security Requirements

* Hash passwords securely using bcrypt.
* Keep secrets in environment variables.
* Include an `.env.example` file with placeholder values, never real credentials.
* Validate all incoming data.
* Protect private routes and API endpoints.
* Verify task ownership for every task operation.
* Configure authentication cookies securely (httpOnly, sameSite, secure in production).
* Never expose passwords, password hashes, or session secrets in API responses.
* Handle errors without revealing internal stack traces.
* Use Prisma safely to interact with the database.

## 9. Definition of Done

The first version of Fluxen is complete when:
* Users can register, log in, and log out.
* Authenticated users can create, view, edit, complete, and delete tasks.
* Users cannot access or modify another user's tasks.
* Tasks persist in PostgreSQL after refreshing the page.
* Input validation and basic error handling work.
* The application is usable on desktop and mobile.
* The frontend communicates correctly with the backend.
* The database schema and migrations are available.
* The README explains setup, environment variables, database configuration, and how to run the application locally.
