# Interview Scheduler

Automated interview scheduling system — no HR required.

## How it works

1. Candidate uploads PDF resume at the upload page
2. System extracts their name & email automatically
3. First available interviewer gets an email with **Accept / Reject** buttons
4. **If accepted** → candidate receives a Google Meet link via email
5. **If rejected** → next interviewer is notified automatically
6. This continues until someone accepts or all interviewers are exhausted

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/SatyaManoj12/Interview-scheduler.git
cd Interview-scheduler
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Edit `.env`:
```
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
PORT=3000
BASE_URL=http://localhost:3000
```

> **Getting Gmail App Password:** Gmail → Settings → Security → 2-Step Verification → App Passwords

### 4. Run the server
```bash
npm start
```

Open **http://localhost:3000** in your browser.

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Resume Upload | `/` | Candidates upload their resume here |
| Admin Panel | `/admin.html` | Add/remove interviewers |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/applications` | Upload a resume |
| GET | `/api/applications` | List all applications |
| GET | `/api/interviewers` | List interviewers |
| POST | `/api/interviewers` | Add interviewer |
| DELETE | `/api/interviewers/:id` | Remove interviewer |
| GET | `/api/respond` | Accept/reject handler (email link) |

## Project Structure

```
Interview-scheduler/
├── backend/
│   ├── server.js           # Express app entry point
│   ├── routes/
│   │   ├── applications.js # Resume upload & processing
│   │   ├── interviewers.js # Add/remove interviewers
│   │   └── respond.js      # Accept/reject email handler
│   ├── middleware/
│   │   ├── upload.js       # Multer PDF upload config
│   │   └── rateLimiter.js  # Rate limiting
│   └── utils/
│       ├── db.js           # JSON file read/write
│       ├── mailer.js       # Nodemailer email sending
│       ├── meetLink.js     # Google Meet link generator
│       └── pdfParser.js    # Extract name/email from PDF
├── frontend/
│   ├── index.html          # Resume upload page
│   └── admin.html          # Admin panel
├── data/
│   ├── interviewers.json   # Interviewer list
│   └── applications.json   # Application records & audit log
├── .env.example
├── .gitignore
└── package.json
```

## Security

- PDF only uploads, max 5MB
- Unique secure tokens for accept/reject links (rotated on each rejection)
- Rate limiting on all endpoints
- No credentials hardcoded — all in `.env`
- Full audit log per application

---
*Built by Nano — automated nightly build*
