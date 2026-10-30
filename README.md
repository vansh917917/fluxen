# Fluxen

Fluxen is a clean, reliable personal task management web application built with React, TypeScript, Express, PostgreSQL, and Prisma.

## Architecture

The project is organized into two primary applications designed for independent hosting (e.g., separate AWS EC2 instances):

- `server`: Express.js + TypeScript REST API with Prisma ORM and PostgreSQL
- `client`: React + TypeScript + Vite + Tailwind CSS frontend application

## Features

- User registration and login with secure authentication
- Protected task dashboard
- Task management: create, read, update, complete, and delete tasks
- Status filtering: All, Pending, Completed
- Responsive, clean UI for mobile and desktop viewports
