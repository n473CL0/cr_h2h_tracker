# Clash Royale H2H Tracker

A full-stack web application to track head-to-head battle statistics between friends in Clash Royale using the official Supercell API.

## 🚀 Architecture Overview

- **Frontend:** React (Tailwind CSS) - A mobile-first dashboard for viewing tallies and adding friends.
- **Backend:** Python (FastAPI) - Handles API logic, user authentication, and periodic data synchronization.
- **Database:** PostgreSQL - Persists user profiles, friendships, and deduplicated battle logs.
- **Orchestration:** Docker Compose - Manages the multi-container environment.

## 🛠️ Project Structure

```text
├── backend/            # FastAPI & SQLAlchemy logic
├── frontend/           # React components & UI
├── database/           # SQL initialization scripts
├── docker-compose.yml  # Container orchestration
└── .env                # Environment variables (API Keys)