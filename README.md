# ApplyForge — College Placement Job Broadcast & Student Application Tracking Platform

![CI](https://github.com/Sanjai-225/applyforge/actions/workflows/ci.yml/badge.svg)

## 🎯 Overview

ApplyForge bridges the gap between college placement cells and students. Placement Officers broadcast job links, students apply on external portals, and ApplyForge tracks everything — who applied, who didn't, and who's facing trouble.

### Key Features

| Feature | Description |
|---|---|
| **Job Broadcast** | Post jobs with priority levels, email alerts, and WhatsApp group messages |
| **2-Step Apply Flow** | Students click the job link, then confirm their status on ApplyForge |
| **Job-Wise Tracker** | See Applied / Not Applied / Facing Trouble per job |
| **Student Compliance** | Track each student's application rate across all assigned jobs |
| **WhatsApp Integration** | 1-click formatted messages, copy-to-clipboard, wa.me share links |
| **CSV Exports** | Export applicant lists or master compliance reports |
| **Defaulter Reminders** | 1-click remind unapplied students via email + WhatsApp |

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend**: Supabase (Auth + PostgreSQL), Zod validation
- **Notifications**: Nodemailer (SMTP), WhatsApp message generation
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites
- Node.js >= 22
- Supabase project (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/Sanjai-225/applyforge.git
cd applyforge
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials and SMTP settings (see [Configuration](#configuration) below).

### 3. Apply Database Migrations

```bash
npm run migrate
```

### 4. Bootstrap Admin Account

```bash
npm run bootstrap:admin
```

### 5. (Optional) Seed Sample Data

```bash
npm run seed
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## ⚙️ Configuration

### Required Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `DATABASE_URL` | PostgreSQL connection string (for migrations) |
| `APP_ORIGIN` | App URL, e.g., `http://localhost:3000` |

### Admin Bootstrap

| Variable | Description |
|---|---|
| `ADMIN_EMAIL` | Placement officer's email |
| `ADMIN_PASSWORD` | Placement officer's password |
| `ADMIN_NAME` | Officer display name |
| `ADMIN_PHONE` | Officer phone number |

### Email (SMTP) — Optional but Recommended

| Variable | Description |
|---|---|
| `SMTP_HOST` | SMTP server (e.g., `smtp.gmail.com`) |
| `SMTP_PORT` | Port (587 for TLS, 465 for SSL) |
| `SMTP_USER` | Email address |
| `SMTP_PASS` | App password (NOT your regular password) |
| `SMTP_FROM` | Display name + email |

### WhatsApp Webhook — Optional

| Variable | Description |
|---|---|
| `WHATSAPP_API_URL` | Webhook URL for automated WhatsApp pushes |
| `WHATSAPP_API_KEY` | API key for the webhook |

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[action]/route.ts   # Register, Login, Logout
│   │   ├── command/route.ts          # All write mutations (CQRS)
│   │   ├── snapshot/route.ts         # Dashboard state reads
│   │   ├── notify/route.ts           # Email & WhatsApp dispatch
│   │   └── export/route.ts           # CSV downloads
│   ├── admin/                        # Officer dashboard
│   ├── dashboard/                    # Student dashboard
│   ├── login/ & register/            # Auth pages
│   └── page.tsx                      # Landing page
├── components/                       # UI components
├── lib/
│   ├── supabase/                     # 3-tier clients (browser/server/admin)
│   ├── types.ts                      # Domain types
│   ├── validation.ts                 # Zod schemas
│   ├── notifications.ts             # Email & WhatsApp services
│   └── ...
└── middleware.ts                     # Route protection
```

## 🔀 Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code. Only updated via reviewed PRs from `testing`. |
| `testing` | Active development. All new features and improvements go here first. |

## 📜 License

MIT

## 🤝 Contributing

1. Create a feature branch from `testing`
2. Make your changes
3. Submit a PR to `testing`
4. After testing, PR from `testing` → `main`
