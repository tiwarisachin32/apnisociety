# ApniSociety - Society & Apartment Management Portal

ApniSociety is a complete society and apartment management platform built with React, React Native Web, TypeScript, Vite, Tailwind CSS, and Firebase.

---

## 🛠️ Prerequisites

Make sure you have installed on your local machine:
- **Node.js** (v18.0.0 or higher recommended, e.g., v20.x or v22.x) - [Download Node.js](https://nodejs.org/)
- **npm** (comes with Node.js) or **bun** / **yarn** / **pnpm**
- (Optional for Android Mobile): Android Studio or Expo Go app on your phone

---

## 🚀 Quick Start (Local Setup in 3 Steps)

### Step 1: Clone or Open the Project
If you downloaded the code as a ZIP archive or cloned it via Git, navigate into the project directory:

```bash
cd apnisociety
```

### Step 2: Install Dependencies

```bash
npm install
```
*(or if using Bun: `bun install`)*

### Step 3: Start the Development Server

```bash
npm run dev
```

Once started, open your web browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 📱 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs the Vite local development server on port 3000 with instant hot-reloading |
| `npm run build` | Compiles and builds the production-ready bundle into the `dist/` folder |
| `npm run preview` | Locally serves and previews the production build from `dist/` |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) to verify code integrity |
| `npm run expo:web` | Runs the app using Expo Web development tools |
| `npm run android` | Starts the Expo development workflow for Android simulators/devices |

---

## 🔑 Firebase & Configuration

The project already contains the Firebase configuration in `firebase-applet-config.json` for persistent Firestore database queries and authentication.

If you wish to configure your own custom Firebase project:
1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database** and **Authentication**.
3. Replace the keys in `firebase-applet-config.json` with your project's credentials.

---

## 📂 Project Architecture

```text
├── public/                 # Static assets, icons, manifest.json, logo.png
├── src/
│   ├── app/                # Application modules & screens
│   │   ├── dashboard.tsx       # Main resident/committee dashboard
│   │   ├── login.tsx           # Multi-device sign-in screen
│   │   ├── maintenance.tsx     # Dues billing, receipts & online payments
│   │   ├── complaints.tsx      # Helpdesk & ticketing workflow
│   │   ├── members.tsx         # Resident, tenant & owner directory
│   │   ├── hallBooking.tsx     # Clubhouse & amenity scheduling
│   │   ├── societySettings.tsx # Society configuration & internal crest
│   │   └── ...
│   ├── components/         # Reusable UI & Layout components
│   │   ├── ui/                 # AppLogo, SocietyLogo, Button, Card, Input, etc.
│   │   └── layout/             # ScreenContainer, Navigation bars
│   ├── constants/          # Theme, permissions, app config
│   ├── context/            # Authentication & session providers
│   ├── services/           # Firebase, mock fallback data & storage
│   ├── types/              # TypeScript definitions
│   ├── App.tsx             # Root app router & navigation shell
│   └── main.tsx            # Web entry point
├── package.json
└── vite.config.ts
```
