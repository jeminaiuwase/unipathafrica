# UniPath Africa

University admissions platform for African students: discover → match → prepare → track → enrol, with student accounts, an adviser/admin console, and built-in user research tools.

- **Live site:** https://unipathafrica.netlify.app
- **Admin console:** https://unipathafrica.netlify.app/admin.html

## What's in this repository

```
public/                    The website (HTML, CSS, JS, programme data)
  data/content.json        Starting catalogue: 400 programmes, 38 scholarships, checklists, FAQs…
netlify/functions/api.mjs  The backend: accounts, saved progress, documents, responses, admin
netlify.toml               Tells Netlify what to publish and where the backend lives
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

## What admins can do
- **Students:** search and filter every account; view profile, applications, checklists, statements, referees and uploaded documents; download documents; send notes that appear on the student's dashboard; reset passwords; delete accounts; export CSV or full JSON.
- **Adviser inbox:** questions from "Ask an adviser", with status, internal notes and one-click email/WhatsApp replies.
- **Responses & insights:** questionnaires, timed usability tests and feedback from every device, with task success rates, ease scores, NPS and most-wanted features calculated automatically.
- **Content:** programmes, scholarships, checklists, enrolment steps, glossary, FAQs, currencies, homepage text and announcement. Edits are saved as a draft, can be previewed, and go live with **Publish live now** (each version is backed up).

## Data & privacy
- Students choose whether to create an account. Without one, data stays only in their browser.
- Sign-up requires consent for UniPath advisers to view the student's data. A privacy notice is at `/#/privacy`.
- Passwords are hashed (scrypt). Sessions are signed tokens. Documents are only downloadable by the student and signed-in admins. The upload limit is 4 MB per file.
- Students can download their data or delete their account from **My Passport**.

## Programme data
All programmes ship as **"Indicative"**: fees, deadlines and entry scores are estimates. Check each one against the university's official website, then tick **Verified** in the admin console. The site shows students which programmes are verified.
