# Cursor Cloud / VM instructions

## What this codebase is

This repo is a single-package Vite + React PWA (no backend server).
Weather and autocomplete are fetched directly from the browser via the Google Gemini API.

## Local prerequisites

- Node.js (this repo was built with Node >= 18; current CI/VM uses a modern Node)

## Setup (dependencies)

1. Install dependencies:
   - `npm ci`

## Configure Gemini

Create a file at `.env.local`:

- `GEMINI_API_KEY=your_actual_gemini_api_key`

Without a valid key, the UI still renders, but API-dependent features will fail (and you'll see errors in the browser console).

## Optional: test without a real API key (mock mode)

To test the full UI (including the “SUCCESS” weather rendering) without calling Gemini:

1. In `/workspace/.env.local`, set:
   - `VITE_GEMINI_MOCK=true`
2. Restart the dev server: `npm run dev`

## Run the app

- Dev server: `npm run dev`
- Open: `http://localhost:3000/`

The dev server binds to `0.0.0.0:3000` in Cursor Cloud environments.

## Build / preview

- Build: `npm run build`
- Preview: `npm run preview`

## PWA notes

`vite-plugin-pwa` generates the service worker during `npm run build` (offline caching is best verified after building).

