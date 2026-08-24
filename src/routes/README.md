# TanStack Router File-Based Routing

This directory contains the routes for your application, managed by TanStack Router.

## File Naming Conventions

- `__root.tsx` - The root layout component that wraps all other routes.
- `index.tsx` - The main home page route (`/`).
- `blogs.index.tsx` - The blog list page route (`/blogs`).
- `blogs.$slug.tsx` - The dynamic blog detail route (`/blogs/:slug`).
- `messages.tsx` - The contact submissions route (`/messages`).

## How It Works

TanStack Router automatically generates `routeTree.gen.ts` based on the file hierarchy in this directory.
Do not edit `routeTree.gen.ts` manually.
