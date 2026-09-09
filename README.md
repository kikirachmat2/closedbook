# Closebook
> **The Zero-Budget Production & Project Management OS**
> *Built on a black canvas for visual curators, filmmakers, and project leads.*

![Closebook Quill Logo](/public/quill-icon.jpg)

---

## ✦ Overview

**Closebook** is an integrated production and project management operating system designed for high-velocity teams who refuse to pay expensive SaaS subscription fees.

Instead of renting costly cloud storage servers, Closebook pioneers the **Bring-Your-Own-Storage (BYOS)** architecture:
- **Receipts & Attachments** land directly into the Project Owner's **Google Drive** (using the free 15 GB quota).
- **Master Records & Accounting** are automatically mirrored into **Google Sheets** for immediate access by accountants and executives.
- **Closebook Engine** (Next.js 15 + Supabase Free Tier) acts as a high-speed, noise-free controller for mobile logging, approval gates, task management, and contextual discussions.

If Closebook ever goes offline, **100% of your production records remain safely in your personal Google Drive and Sheets.**

---

## ✦ Design System: Savee Reference

Closebook is crafted with extreme aesthetic discipline, directly adopting the **Savee editorial design language**:

- **Obsidian Canvas (`#050505`)**: Pure near-total darkness where surfaces and content float without visual clutter.
- **Electric Indigo (`#1500ff`)**: The sole chromatic accent in the system, reserved exclusively for the primary CTA button.
- **Binary Radius Vocabulary**:
  - `9999px` (Pills) for all controls: buttons, tags, search inputs.
  - `14px` for all passive surfaces: cards, modals, preview frames.
- **Zero Drop Shadows**: Hierarchy is expressed purely via surface color stepping (`#050505` canvas → `#151515` elevated panel → `#1e1e1e` deep overlay).
- **Sculptural Typography**: 96px display headlines compressed with `0.96` line-height and `-0.04em` tracking.

---

## ✦ Dynamic Persona Presets

When a team lead or user launches Closebook, they select their operational workflow:

| Persona | Domain | Auto-Configured Google Drive & Sheets | Highlights |
|---|---|---|---|
| 🎬 **Film & Video Production** | Feature films, commercials, MV, indie crews | `01_Petty_Cash`, `02_Call_Sheets`, `03_Deal_Memos`, `04_Equipment_Rental` | UPM multi-pocket cash, camera receipt logging, missing receipt alerts, daily shooting notes |
| 🏢 **Office & Creative Agency** | Software houses, design studios, retainers | `01_Invoices_Vendor`, `02_Client_Contracts`, `03_Deliverables_Approval` | Client PO matching, retainer burn-rate tracking, team reimbursements |
| 🎪 **Event Organizer** | Concerts, festivals, wedding organizers | `01_Bukti_Transfer_Vendor`, `02_Izin_Venue`, `03_Rundown_Kontak` | Loading-in checklists, division pocket cash (Sound, Konsumsi, LO) |
| 🎓 **Campus & Student Org** | BEM, student councils, campus events | `01_Nota_Asli_LPJ`, `02_Proposal_Surat`, `03_Dokumentasi` | LPJ-ready exports, panitia cash transparency, receipt verification |
| ⚡ **General & Freelancer** | Solopreneurs, creators, consultants | `01_Receipts_Expenses`, `02_Contracts`, `03_Tax_Documents` | Solo project vault, tax-deductible receipt cloud, milestone tracking |

---

## ✦ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router) with React 19 & TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom Savee design tokens
- **Icons**: [Lucide React](https://lucide.dev/)
- **Mobile Distribution**: Progressive Web App (PWA) with native camera & offline caching
- **Database & Realtime**: [Supabase](https://supabase.com/) (PostgreSQL free tier)
- **File Storage**: Google Drive API (`drive.file` scope)
- **Live Ledger**: Google Sheets API v4
- **Hosting**: [Vercel](https://vercel.com/) (Hobby Plan)

---

## ✦ Quick Start

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/frahmat68-beep/closebook.git
cd closebook
npm install
```

### 2. Run Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Environment Variables (For Full Production Sync)

Create a `.env.local` file with:

```env
# Google OAuth & API
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=http://localhost:3000

# Supabase (Free Tier)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## ✦ Deploying to Vercel

1. Push your changes to GitHub.
2. Go to [Vercel](https://vercel.com/new).
3. Import the `frahmat68-beep/closebook` repository.
4. Add the environment variables configured above.
5. Hit **Deploy**.

---

## ✦ License

MIT License — free for independent filmmakers, creators, and organizers worldwide.
