# 🏎️ FullThrottle — Automotive Database

> A browser-based web application to manage, explore and compare cars from around the world, with real-time F1 standings.

**Live demo:** [https://project-browser-programming.vercel.app](https://project-browser-programming.vercel.app)

---

## 📋 Table of Contents

1. [Project Description](#project-description)
2. [Features](#features)
3. [Architecture Overview](#architecture-overview)
4. [Backend](#backend)
5. [Technology Choices](#technology-choices)
6. [Setup Instructions](#setup-instructions)
7. [AI Usage Disclosure](#ai-usage-disclosure)
8. [Reflection & Future Improvements](#reflection--future-improvements)

---

## Project Description

**Problem definition:**
There is no simple, free, and visually appealing tool that lets car enthusiasts build and maintain their own personal automotive database — with technical specs, images, sound clips, bilingual descriptions, and real F1 data — all in one place.

**Solution:**
FullThrottle is a fully client-side web application that solves this by providing:
- A searchable, filterable card-based catalog of vehicles
- Full CRUD operations (Create, Read, Update, Delete) via a REST API
- Persistent cloud storage via Supabase (PostgreSQL)
- Real-time F1 standings pulled from a public API
- Bilingual interface (FR/EN) with automatic description translation
- Admin authentication to protect write operations

---

## Features

| Feature | Description |
|---|---|
| 🔍 Search & filters | Real-time search by brand, model, country — filter by category and engine type |
| ➕ Add / Edit / Delete | Full CRUD with form validation and Supabase persistence |
| 🌐 Bilingual (FR/EN) | Full interface translation + automatic description translation via MyMemory API |
| 🖼️ Image + sound | Background image and engine sound URL per vehicle |
| ⚡ Compare | Side-by-side comparison of 2 vehicles |
| 📊 Statistics | Dashboard with charts (Chart.js) — avg power, distribution by category |
| ★ Favorites | Mark vehicles as favorites, filter to show only favorites |
| 🔍 Car Query Import | Import real vehicle data from Car Query API |
| 🏁 F1 Standings | Live F1 2025 driver/constructor standings + last race results (Jolpica API) |
| 🔐 Auth | Admin login via Supabase Auth — write operations hidden for visitors |
| 📥 JSON Import/Export | Export the full database as `.json`, re-import it later |
| 📱 Responsive | Grid and list views, works on mobile |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                         │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ cars.html│  │  f1.html │  │login.html│  │ (other pages)  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────────────┘  │
│       │              │              │                            │
│  ┌────▼─────────────────────────────────────────────────────┐   │
│  │                    JavaScript Modules                     │   │
│  │  auth.js  │  api.js  │  cars.js  │  i18n.js  │  f1.js   │   │
│  │  translate.js  │  carquery.js                            │   │
│  └────┬──────────────┬──────────────┬────────────────────────   │
│       │              │              │                            │
└───────┼──────────────┼──────────────┼────────────────────────────
        │              │              │
        ▼              ▼              ▼
┌───────────────┐ ┌──────────────┐ ┌─────────────────────┐
│    Supabase   │ │  MyMemory    │ │  Jolpica F1 API      │
│  (PostgreSQL) │ │  Translate   │ │  api.jolpi.ca/ergast │
│               │ │  API (free)  │ │  (free, no key)      │
│  REST API     │ │              │ └─────────────────────-┘
│  Auth (JWT)   │ └──────────────┘
│  RLS policies │                  ┌─────────────────────┐
└───────────────┘                  │  Car Query API       │
        │                          │  carqueryapi.com     │
        ▼                          │  (free, no key)      │
┌───────────────┐                  └─────────────────────-┘
│    Vercel     │
│  (Frontend    │
│   Hosting)    │
└───────────────┘
```

### File structure

```
frontend/
├── cars.html        # Main application page
├── cars.css         # Main styles
├── cars.js          # App logic — state, rendering, CRUD
├── api.js           # Network layer — all Supabase REST calls
├── auth.js          # Session management — login/logout/admin check
├── i18n.js          # FR/EN translations dictionary + applyLang()
├── translate.js     # Auto-translation via MyMemory API
├── carquery.js      # Car import from Car Query API
├── f1.html          # F1 standings page
├── f1.css           # F1 page styles
├── f1.js            # F1 data fetching + rendering
├── login.html       # Login page
└── login.css        # Login page styles
```

### Data flow

```
User action → cars.js → api.js → Supabase REST API → PostgreSQL
                  ↓
           renderCards()  ←  updates in-memory cars[] array
                  ↓           + localStorage cache
             DOM updated
```

---

## Backend

This project uses **Supabase** as a serverless backend (BaaS — Backend as a Service).

Supabase provides:
- A **PostgreSQL** database hosted in the cloud
- An **auto-generated REST API** on every table (`/rest/v1/cars`)
- **Row Level Security (RLS)** policies for access control
- **JWT-based authentication** via Supabase Auth

The frontend communicates directly with the Supabase REST API via `fetch()` calls in `api.js`.
No local backend installation is required — the application is fully functional via the
public Supabase API endpoint.

### Why no Express server?

> This approach satisfies the *"lightweight serverless backend"* requirement from the project
> specification, and follows the documented exception:
> *"If the backend is not publicly hosted, the frontend must still work using a public API"*
> — which it does, via the Supabase REST API publicly hosted at
> `https://gathpbjhirtksasfmicn.supabase.co`.

### API Endpoints (Supabase REST)

| Method | Endpoint | Action |
|---|---|---|
| `GET` | `/rest/v1/cars?select=*&order=id` | Fetch all vehicles |
| `POST` | `/rest/v1/cars` | Create a new vehicle |
| `PATCH` | `/rest/v1/cars?id=eq.:id` | Update a vehicle |
| `DELETE` | `/rest/v1/cars?id=eq.:id` | Delete a vehicle |

### Security (Row Level Security)

Access is controlled by PostgreSQL RLS policies defined in `schema.sql`:
- **Read** — public (anyone can view vehicles)
- **Write / Update / Delete** — public at database level, but restricted at UI level via Supabase Auth (only the admin account sees write buttons)

---

## Technology Choices

| Technology | Role | Justification |
|---|---|---|
| **HTML5 / CSS3 / JS (Vanilla)** | Frontend | No framework needed — keeps the project lightweight and demonstrates core web skills |
| **Supabase** | Database + Auth | Free tier (500MB), auto-generated REST API, built-in auth, visual dashboard — no backend server needed |
| **PostgreSQL** (via Supabase) | Data storage | Structured relational data suits the vehicles schema (typed columns, serial IDs) |
| **Vercel** | Hosting | Free, deploys directly from GitHub, zero configuration for static frontends |
| **Jolpica F1 API** | F1 data | Free, no key required, official Ergast successor, CORS-friendly |
| **MyMemory API** | Translation | Free (1000 req/day), no key required, works directly from the browser |
| **Car Query API** | Vehicle import | Free, no key required, 10,000+ real vehicle models with specs |
| **Chart.js** | Stats charts | Lightweight, easy to use, good-looking defaults |

### Why no backend framework?

The project requirements allow for a **mock API** if documented. Since Supabase exposes a full REST API automatically on the PostgreSQL database, we use it directly from the frontend. This eliminates the need for a Node.js/Express server while still satisfying the "backend API" requirement — the database logic, row-level security, and authentication all run on Supabase's infrastructure.

---

## Setup Instructions

### Prerequisites
- A [Supabase](https://supabase.com) account (free)
- A [Vercel](https://vercel.com) account (free)
- A [GitHub](https://github.com) account

### 1. Set up Supabase

1. Create a new Supabase project
2. Go to **SQL Editor** → paste the contents of `schema.sql` → **Run**
3. Go to **Authentication → URL Configuration**:
   - Set **Site URL** to your Vercel URL: `https://your-project.vercel.app`
   - Add `https://your-project.vercel.app/**` to **Redirect URLs**
4. Go to **Authentication → Users** → **Invite user** with your admin email
5. Go to **Settings → API** and copy your **Project URL** and **anon public key**

### 2. Configure the app

In `api.js` and `auth.js`, replace the placeholders:
```javascript
const SUPABASE_URL      = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
const ADMIN_EMAIL       = 'your@email.com'; // in auth.js only
```

### 3. Deploy to Vercel

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/fullthrottle.git
git push -u origin main
```

Then on [vercel.com](https://vercel.com):
- **New Project** → import your GitHub repo → **Deploy**

No environment variables needed (Supabase anon key is public by design).

---

## AI Usage Disclosure

This project was developed with the assistance of **Claude (Anthropic)** as a coding assistant.

### Tools used
- **Claude (claude.ai)** — primary AI assistant throughout the project

### What was AI-generated
The following files were largely generated with Claude's help:
- Initial structure of `cars.html`, `cars.css`, `cars.js`
- `api.js` — Supabase REST integration layer
- `auth.js` — Supabase Auth session management
- `f1.html`, `f1.css`, `f1.js` — F1 standings page
- `translate.js` — MyMemory API integration
- `carquery.js` — Car Query API integration
- `i18n.js` — bilingual translation system
- `schema.sql` — PostgreSQL table schema and RLS policies
- This README

### What was manually modified
- Vehicle data (descriptions, images, real URLs)
- Color scheme and visual design decisions
- Feature priorities and scope decisions
- Debugging and testing of API integrations
- Configuration of Supabase (URL, RLS policies, Auth)
- Deployment configuration on Vercel

### How we worked with AI
The development process was iterative and conversational. Claude provided code suggestions and explanations, while the student made architectural decisions, tested the code in the browser, reported errors back (with console screenshots), and directed the development priorities. All generated code was reviewed and understood before being used. The student can explain how every part of the code works.

---

## Reflection & Future Improvements

### What worked well
- Supabase as a backend-as-a-service is an excellent choice for a frontend-only project — it provides real persistence, authentication, and a REST API without needing a server
- The separation of concerns (api.js / cars.js / i18n.js / auth.js) makes the codebase maintainable
- The bilingual system with automatic translation is a practical and impressive feature

### Challenges encountered
- CORS restrictions with third-party APIs (Car Query) required proxy workarounds
- Supabase Auth configuration (redirect URLs) was tricky to set up correctly
- Managing async state (loading → cache → fresh data) required careful design

### Future improvements
- **Car Query import** — fix the CORS issue with a small serverless function acting as proxy
- **User roles** — allow multiple contributors with different permission levels
- **Image upload** — upload images directly to Supabase Storage instead of external URLs
- **Engine sound recording** — record and upload engine sounds directly in the browser
- **Mobile app** — convert to a PWA (Progressive Web App) for offline use
- **F1 live timing** — integrate a real-time WebSocket feed for live race data
- **AI descriptions** — integrate an LLM to auto-generate vehicle descriptions from specs