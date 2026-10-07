# HomeCraft Connect

A React and Vite marketplace connecting local buyers with home-based sellers.

## Run locally

Requirements: Node.js 20.19+ and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (by default, `http://localhost:3000`).

## Firebase

The app uses the Firebase project configured in `src/firebase.ts`. Firebase Authentication must have Email/Password enabled, and the project must have a Cloud Firestore database with rules that allow authenticated account and marketplace operations. Firebase Console settings and security rules are managed outside this source workspace.

## Checks

```sh
npm run lint
npm run build
```