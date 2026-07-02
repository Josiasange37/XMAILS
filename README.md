# XMAILS — Email Marketing Platform

A modern, full-stack email marketing application built with Next.js 14, featuring contact management, campaign creation, AI-powered email generation, and advanced analytics.

## 🚀 Features

### Contact Management
- **Smart Import** — CSV/Excel import with French/English header detection (`Adresse e-mail`, `Nom complet`, etc.)
- **Category System** — Built-in categories: Follower, Sponsor, Partner, Friend, Enterprise
- **Bulk Operations** — Bulk add, deduplicate, fix uncategorized contacts
- **Real-time Validation** — Email existence checking with instant feedback
- **Duplicate Prevention** — Automatic deduplication keeping oldest records

### Campaigns & Emails
- **Compose Editor** — Rich text editor with AI-assisted writing
- **AI Email Generation** — Generate personalized emails with context (recipient details, attachments, brand voice)
- **Broadcasts** — Send to segments with scheduling support
- **Promotions** — Dedicated promotional campaign workflow
- **Templates** — Reusable email templates
- **Inbox/Sent/Scheduled** — Full email lifecycle management

### Analytics & Insights
- **Dashboard** — Real-time metrics with dark/light theme support
- **Delivery Tracking** — Open rates, click rates, bounce handling
- **Timeline Views** — Historical performance visualization

### Technical Features
- **Dark/Light Theme** — Warm charcoal dark mode (no blue), violet primary, 3-tier elevation system
- **Responsive Design** — Mobile-first with Tailwind CSS
- **TypeScript** — Full type safety
- **Supabase/PostgreSQL** — Scalable database backend
- **Vercel Ready** — Optimized for edge deployment

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS Variables |
| Database | Supabase (PostgreSQL) |
| AI | OpenAI-compatible API |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| UI Components | Radix UI primitives |
| Deployment | Vercel |

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- npm/pnpm/yarn
- Supabase account (or PostgreSQL)

### Installation

```bash
# Clone the repository
git clone https://github.com/Josiasange37/XMAILS.git
cd XMAILS

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### Environment Variables

```env
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI (OpenAI-compatible)
AI_API_KEY=your_api_key
AI_BASE_URL=https://api.openai.com/v1  # or custom endpoint
AI_MODEL=gpt-4o-mini

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

Run the schema migration:

```bash
# Using Supabase CLI
supabase db reset

# Or manually run scripts/schema.sql in your PostgreSQL instance
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build & Deploy

```bash
# Production build
npm run build

# Preview production build
npm run start

# Deploy to Vercel
vercel --prod
```

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── ai/                 # AI email generation
│   │   ├── contacts/           # Contact CRUD + utilities
│   │   │   ├── deduplicate/    # Remove duplicates
│   │   │   ├── fix-uncategorized/  # Auto-tag uncategorized
│   │   │   ├── set-category/   # Bulk category assignment
│   │   │   └── exists/         # Email existence check
│   │   ├── emails/             # Email operations
│   │   └── analytics/          # Metrics endpoints
│   ├── dashboard/              # Dashboard pages
│   │   ├── contacts/           # Contact management UI
│   │   ├── emails/             # Compose, inbox, sent, scheduled
│   │   ├── broadcasts/         # Campaign builder
│   │   └── analytics/          # Reports
│   ├── globals.css             # Design system (CSS variables)
│   └── layout.tsx
├── components/
│   ├── ui/                     # Reusable UI primitives
│   ├── contact-select.tsx      # Contact picker with search
│   ├── page-transition.tsx     # Route transitions
│   └── sidebar.tsx             # Navigation
├── lib/
│   ├── ai.ts                   # AI client wrapper
│   ├── email-brand.ts          # Brand settings
│   └── utils.ts                # Helpers
├── db.ts                       # Supabase client
└── types/
    └── contact.ts              # TypeScript types
```

## 🎨 Design System

### Color Palette (CSS Variables)

**Light Theme** (default):
- Background: `#ffffff`
- Primary: `#7c3aed` (violet)
- Muted: `#f4f4f5`

**Dark Theme** (warm charcoal, no blue):
- `--background: #0a0a10` (base)
- `--elevated: #12121b` (cards)
- `--overlay: #1a1a25` (modals)
- `--primary: #7c3aed` (violet)
- `--border: #2a2a3a`

### Theme Switching
```css
/* Automatic via prefers-color-scheme */
/* Or manual: document.documentElement.classList.add('dark') */
```

## 🔧 API Reference

### Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contacts` | List contacts (paginated, filterable) |
| POST | `/api/contacts` | Create contact |
| PATCH | `/api/contacts/[id]` | Update contact |
| DELETE | `/api/contacts/[id]` | Delete contact |
| POST | `/api/contacts/exists` | Check email existence |
| DELETE | `/api/contacts/deduplicate` | Remove duplicates |
| POST | `/api/contacts/fix-uncategorized` | Tag uncategorized as follower |
| POST | `/api/contacts/set-category` | Bulk category assignment |

### AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/email` | Generate email from prompt |

## 🧪 Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run typecheck    # TypeScript check
```

## 📄 License

MIT License — feel free to use for personal or commercial projects.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues, open a GitHub issue or check the [documentation](/docs).

---

Built with ❤️ using Next.js, Supabase, and Tailwind CSS.