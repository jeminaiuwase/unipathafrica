# UniPath Africa

University admissions platform for African students: discover → match → prepare → track → enrol, with student accounts, an adviser/admin console, and built-in user research tools.

- **Live site:** https://unipathafrica.netlify.app
- **Admin console:** https://unipathafrica.netlify.app/admin.html

## What's in this repository

```
public/                    The website (HTML, CSS, JS, programme data)
  data/content.json        Starting catalogue: 738 programmes, 38 scholarships, checklists, FAQs…
netlify/functions/api.mjs  The backend: accounts, saved progress, documents, responses, admin
netlify/functions/daily.mjs  Runs every day at 06:00 UTC: reminders, analytics tidy-up, monthly data check
netlify/lib/jobs.mjs       Reminder, monthly report, analytics and email code
netlify.toml               Tells Netlify what to publish, where the backend lives, and runs scripts/snapshot.mjs
scripts/snapshot.mjs       Records the code on each deploy so the owner can download it from the admin console
package.json               Backend dependency (@netlify/blobs)
```

Student data (accounts, progress, uploaded documents, questionnaire answers, adviser requests) is stored in **Netlify Blobs** on your Netlify site. There are no extra services or databases to sign up for.

## Deploy (one time, about 10 minutes)

> ⚠️ Drag-and-drop deploys **can't run the backend**. Use option A or B.

### Option A — GitHub (recommended, no coding)
1. Create a free account at github.com and make a **new private repository** (e.g. `unipath-africa`).
2. On the empty repository page, click **"uploading an existing file"**. Unzip this package on your computer, then drag in **everything inside the folder** (`public`, `netlify`, `netlify.toml`, `package.json`, `README.md`, `.gitignore`). Click **Commit changes**.
3. In Netlify: **Add new site → Import an existing project → GitHub**, pick the repository and click **Deploy**. The settings are read from `netlify.toml` automatically.
   - Already created `unipathafrica` by drag-and-drop? Open that site → **Site configuration → Build & deploy → Link repository** instead, so you keep the name.
4. Site name: **Site configuration → Change site name → `unipathafrica`**.
5. Turn on **Forms** (backup copies of responses and email alerts): **Site configuration → Forms → Enable form detection**, then **Deploys → Trigger deploy**.

From then on, any change pushed to GitHub redeploys automatically. Day-to-day content changes don't need GitHub at all: use the admin console's **Publish live now**.

### Option B — Netlify CLI
```bash
npm install
npx netlify-cli login
npx netlify-cli link          # pick the unipathafrica site
npx netlify-cli deploy --prod
```

## First sign-in to the admin console
- Open `/admin.html`, leave **Email** blank and enter the owner passcode (shared separately).
- **Change it straight away:** Settings → Change owner passcode.
- Add each team member under **Settings → Team access** so they get their own sign-in.

Optional hardening (Netlify → Site configuration → Environment variables):
- `UNIPATH_SECRET` — a long random string used to sign login sessions (otherwise one is generated automatically and stored in Blobs).
- `ADMIN_PASSCODE` — sets the initial owner passcode instead of the default.

## Team, roles and permissions
- The **owner** (passcode sign-in) always has every permission.
- **Team & roles** in the admin console: add people, give each a role, and change their role at any time.
- The **access matrix** lets the owner create roles and tick exactly what each role can do (see students, delete accounts, publish, turn prices on/off, manage the team, download the code…). The server checks permissions on every request.
- Built-in roles: Admin, Adviser, Content editor, Researcher, Viewer — all editable.

## Prices on / off
Prices are **hidden by default** and the site tells students everything is free. The owner (or anyone with the pricing permission) flips this under **Prices on / off** — it changes the live site instantly, no code or redeploy needed.

## Download the site code
**Download site code** in the admin console gives a zip of the whole project (pages, scripts, backend, settings and the current live content). It contains no student data or passwords.

## What admins can do
- **Students:** search and filter every account; view profile, applications, checklists, statements, referees and uploaded documents; download documents; send notes that appear on the student's dashboard; reset passwords; delete accounts; export CSV or full JSON.
- **Adviser inbox:** questions from "Ask an adviser", with status, internal notes and one-click email/WhatsApp replies.
- **Responses & insights:** questionnaires, timed usability tests and feedback from every device, with task success rates, ease scores, NPS and most-wanted features calculated automatically.
- **Country guides & visa help:** costs, visa steps, documents, fees, money rules, interview questions and scam warnings for each country.
- **Content:** programmes, scholarships, checklists, enrolment steps, glossary, FAQs, currencies, homepage text and announcement. Edits are saved as a draft, can be previewed, and go live with **Publish live now** (each version is backed up).

## Data & privacy
- Students choose whether to create an account. Without one, data stays only in their browser.
- Sign-up requires consent for UniPath advisers to view the student's data. A privacy notice is at `/privacy`.
- Passwords are hashed (scrypt). Sessions are signed tokens. Documents are only downloadable by the student and signed-in admins. The upload limit is 4 MB per file.
- Students can download their data or delete their account from **My Passport**.

## Programme data (738 programmes)
Each programme carries one of three honest labels:
- **Verified**: fees checked on the university's official website (with the source link and date).
- **On official list**: the programme appears on the university's official programme list; fees are still estimates.
- **Indicative**: estimated figures, to be checked.

Application links were checked university by university on 21 Oct 2026 ("Links checked" on each programme page). In the admin console, filter Programmes by "Not verified", "On official list" or "Links not checked yet" to keep improving the data. When new catalogue data ships with the code, the live site adds it automatically and the dashboard asks you to publish once.

## Student sections
- **Thrive** (`/thrive`): life at university, including the first 100 days, support services at each university, opportunities, a year-by-year plan, a grades tracker, a money tracker and careers.
- **Money Skills** (`/money`): 9 plain-language lessons with quizzes and calculators. Admins can edit the lessons.
- **True Cost Planner** (`/prepare/costs`): every cost beyond tuition, with a plain-English summary.
- **Destination guides & Visa help** (`/countries`, `/visa`): guidance only; UniPath never submits visas.
- **Also:** deadline reminders and "Remind me when applications open", share with family (`/share`), subject checker (`/prepare/subjects`), scholarship calendar (`/prepare/scholarships/calendar`, with calendar export), offer comparison (`/offers`), and English / Kiswahili / French / Luganda (beta).

## Fees: who gets paid
Every fee shown says who receives it (the university, the government or its visa centre, or the test provider). UniPath is free and never collects application, tuition or visa fees. Adviser plan prices are optional and only appear when the owner turns pricing on.

## Email, reminders and the daily job
`daily.mjs` runs every day. It emails students 14, 7, 2 and 0 days before their application, acceptance, internship and visa dates. It also tells them when a course or scholarship they are watching opens. Students can switch reminders off in **My account**. On the 1st of each month it emails the owner a data freshness report (it is also shown in admin → **Monthly data check**).

To send real emails, add these environment variables in Netlify and redeploy:
- `RESEND_API_KEY`: a free key from resend.com
- `EMAIL_FROM`: e.g. `UniPath Africa <hello@yourdomain>` (the domain must be verified in Resend)
- `OWNER_EMAIL`: where the monthly report goes

Without them nothing breaks: messages wait in admin → **Outbox**, with one-click email and WhatsApp buttons. Admins can also do a dry run or run a job immediately from there.

## Analytics (privacy-friendly)
The site counts page views, searches and feature use. It respects "Do Not Track", stores no names, emails or IP addresses, and keeps only daily totals. See admin → **Analytics** (permission `analytics.view`).

## Languages
Translations live in `content.json → translations` and can be edited in admin → **Languages**. The Luganda text is a first draft and should be checked by a fluent speaker.

## Importing spreadsheets
In admin → Programmes (also Scholarships, Opportunities, Glossary and FAQs), click **Import** to upload a CSV, XLSX or ODS file. Then:
- Match the columns (the tool guesses them for you).
- Review the duplicate check, which matches by id or by university + name.
- Choose whether to update or skip duplicates.

A template can be downloaded from the same screen.
