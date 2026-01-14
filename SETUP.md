# Chrysalis - Setup Instructions

## 🦋 Firebase Setup

To connect the app to Firebase, you need to create a Firebase project and add the configuration:

### Step 1: Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" or "Create a project"
3. Name it "chrysalis-app" (or your preferred name)
4. Follow the setup wizard

### Step 2: Enable Authentication
1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** provider
3. Click Save

### Step 3: Create Firestore Database
1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Start in **production mode** (we'll configure rules later)
4. Choose a location close to you

### Step 4: Get Your Configuration Keys
1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the web icon (`</>`) to add a web app
4. Register the app with a nickname (e.g., "Chrysalis Web")
5. Copy the configuration object

### Step 5: Add Keys to Your App
Create a `.env` file in the project root and add your keys:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Step 6: Update Firestore Security Rules
In Firebase Console, go to **Firestore Database** > **Rules**, and replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /chapters/{chapterId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    match /versions/{versionId} {
      allow read, write: if request.auth != null;
    }
    match /wisdomLibrary/{wisdomId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    match /tiktokScripts/{scriptId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Step 7: Run the App
```bash
npm run dev
```

Navigate to `http://localhost:5173/login` and create your account!

## 🚀 Deployment (Coming Soon)
Instructions for deploying to Vercel will be added in a later prompt.
