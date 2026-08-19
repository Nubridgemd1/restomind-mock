# Restomind Behavioral Health — website mock

Static mock for **restomindwellness.com** — navy blue + green theme, psychiatry & therapy for adults (Houston, TX & telehealth). Contact: **346-715-3734**, **pauline@restomindwellness.com**.

**Shareable links (GitHub Pages):** the **main site** is the repo root; the **admin** is `admin.html`.

## Pages
| File | What |
|---|---|
| `index.html` | Main site + **Book an Appointment** box |
| `blog.html` | Blog — topics with **shareable links**, **share buttons**, and a **comment box** on each topic |
| `admin.html` | Admin — **add/update blog topics**, **moderate comments**, **Marketing Kit** with editable flyers (print / save as PDF) |
| `data.js` | Shared data layer (Supabase when configured, else localStorage) |

Admin passcode (demo): **`restomind2026`** — change it anytime in the admin under **⚙️ Settings → Admin Passcode** (saved per browser).

## Book an Appointment → reports to the office
The booking box **instantly emails the request to `pauline@restomindwellness.com`** and offers a **one-tap text to 346-715-3734**.

- **Email (automatic):** get a free key at [web3forms.com](https://web3forms.com) registered to `pauline@restomindwellness.com`, then set `WEB3FORMS_KEY` in `data.js`. Until then, the form shows one-click **Email** / **Text** buttons as a fallback.
- **Text (automatic):** a static page can't send SMS on its own. Two options:
  1. **One-tap:** after submitting, the patient taps **"Also text us these details"** → their phone texts 346-715-3734 with the details prefilled.
  2. **Fully automatic:** set `OFFICE_SMS_GATEWAY` in `data.js` to the number's carrier email-to-SMS address (e.g. `3467153734@vtext.com` for Verizon, `@txt.att.net` AT&T, `@tmomail.net` T-Mobile) — the booking email is then also CC'd to that gateway, delivering a text. (For a robust solution, wire Twilio via a small serverless function.)

## Live blog + comments (Supabase, free)
Without keys, blog topics/comments work in each browser (demo). To make them **live and shared for everyone**, add a free Supabase project:

1. Create a project at [supabase.com](https://supabase.com); SQL editor → run:

```sql
create table posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, question text not null, category text,
  excerpt text, body text, published boolean default true,
  created_at timestamptz default now());
create table comments (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null, name text not null, body text not null,
  status text default 'approved', created_at timestamptz default now());

alter table posts enable row level security;
alter table comments enable row level security;
create policy "read posts"     on posts    for select using (true);
create policy "read comments"  on comments  for select using (true);
create policy "add comments"   on comments  for insert with check (true);
-- Mock-friendly admin writes via the anon key. For production, protect
-- post edits + moderation behind Supabase Auth instead of these open policies:
create policy "write posts"        on posts    for all using (true) with check (true);
create policy "moderate comments"  on comments  for all using (true) with check (true);
```

2. In `data.js` set `SUPABASE_URL` and `SUPABASE_ANON_KEY` (Project Settings → API).

Marketing-kit flyers are edited in the admin and saved in that browser; they can be printed / saved as PDF to share. (Add a Supabase table if you want flyer edits synced across devices.)

## Hosting
Any static host. GitHub Pages: Settings → Pages → deploy from `main` / root.

Theme: navy blue `#1b3f75` + green `#2f8f5b`. Poppins (headings) + Mulish (body).
