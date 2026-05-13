# Asthma Shield Web App

Asthma Shield is a Rwanda-focused asthma management application that uses weather-based risk prediction for Kigali, Huye, Musanze, and Rubavu.

## Features

- Weather-based asthma risk overview for key cities
- Patient symptom submission and doctor recommendations
- Admin dashboard with usage metrics
- Telemedicine readiness for video consultations
- React + Tailwind frontend with Express backend

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file from `.env.example` and add your OpenWeather API key:
   ```bash
   copy .env.example .env
   ```
3. Start the backend:
   ```bash
   npm run backend
   ```
4. Start the frontend in another terminal:
   ```bash
   npm run dev
   ```

## Project Structure

- `src/` — React application files
- `backend/` — Express API server
- `tailwind.config.js` — Tailwind CSS configuration
- `vite.config.ts` — Vite configuration
