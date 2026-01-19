---
description: Start React development server or build for production
---

# Development Flow (Vite + React)

This workflow describes how to develop and build the modernized `reis-admin` project.

## Prerequisites

Ensure dependencies are up to date:
```bash
npm install
```

## Commands

### 1. Start Development Server
// turbo
```bash
npm run dev
```
**Usage**: Main development loop. Provides Hot Module Replacement (HMR) for both React components and Tailwind CSS.
**Access**: Usually at `http://localhost:8080` (or `5173`)

### 2. Production Build
```bash
npm run build
```
**Usage**: Compiles TypeScript, bundles assets with Vite, and processes CSS with Tailwind 4.
**Output**: Everything in `dist/` directory.

### 3. Preview Production
```bash
npm run preview
```
**Usage**: Serves the `dist/` folder locally to verify the production build.

## Key Files

- `src/App.tsx`: Main layout and state.
- `input.css`: Tailwind 4 source and custom Mendelu themes.
- `vite.config.ts`: Path aliases (`@/`) and Vite plugins.
