# Smart Grocery List & Inventory Manager

A complete, industry-oriented cross-platform mobile application and backend service that helps users manage household grocery inventory, track quantities, receive low-stock and expiry alerts, predict restocking, scan barcodes, and share shopping lists with family members.

## Tech Stack (Option B - Intermediate)
* **Mobile:** React Native CLI, TypeScript, Redux Toolkit, Axios, AsyncStorage
* **Backend:** Node.js, Express.js, JWT, bcrypt
* **Database:** MongoDB, Mongoose

---

## Project Directory Structure

```text
Smart-Grocery-Inventory-Manager/
│
├── mobile/                   # React Native CLI + TypeScript mobile app
│   ├── android/              # Native Android configuration files
│   ├── ios/                  # Native iOS configuration files
│   ├── src/                  # Application source code
│   └── App.tsx               # App entrypoint
│
├── server/                   # Node.js + Express REST API
│   ├── config/               # DB and environment configuration
│   ├── controllers/          # Business logic controllers
│   ├── middleware/           # JWT verification & error handling
│   ├── models/               # Mongoose schemas (MongoDB database)
│   ├── routes/               # API endpoints declarations
│   └── server.js             # Main server entrypoint
│
├── docs/                     # API routes, guides, and diagrams
├── .gitignore                # Git ignore patterns
├── .env.example              # Environment variables template
└── README.md                 # Project guide & proof of work documentation
```

---

## Installation & Setup

Please refer to the installation steps in subsequent project phases.
* **Server Setup:** Go to the `server/` directory, install packages, and launch via `npm run dev`.
* **Mobile Setup:** Go to the `mobile/` directory, install packages, start Metro via `npx react-native start`, and deploy via `npx react-native run-android`.
