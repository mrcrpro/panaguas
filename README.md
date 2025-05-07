
# Panaguas Portal

This is a Next.js application built with Firebase for authentication, data storage, and backend services for the PanAguas umbrella sharing system.

## Getting Started

1.  **Install Dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

2.  **Set Up Environment Variables:**

    *   Create a new file named `.env.local` in the root of your project by copying `.env.local.example`.
    *   Open `.env.local` and replace the placeholder values with your actual Firebase project credentials, a secure API key for ESP32 communication, and your email service credentials.

    **Client-Side Firebase Config (from Firebase Console):**
    *   Find these in your Firebase project settings:
        *   Go to Project settings (gear icon) > General.
        *   Scroll down to "Your apps".
        *   Select your web app.
        *   Under "SDK setup and configuration", choose the "Config" option.
        *   Copy the corresponding values (`apiKey`, `authDomain`, etc.) into the `NEXT_PUBLIC_FIREBASE_*` variables in your `.env.local` file.

    **Server-Side Firebase Admin SDK Config (Service Account):**
    *   Go to Firebase Project settings > Service accounts.
    *   Click "Generate new private key" and download the JSON file. **Keep this file secure!**
    *   Copy the following values from the downloaded JSON file into your `.env.local`:
        *   `project_id` -> `FIREBASE_PROJECT_ID` (should match `NEXT_PUBLIC_FIREBASE_PROJECT_ID`)
        *   `client_email` -> `FIREBASE_CLIENT_EMAIL`
        *   `private_key` -> `FIREBASE_PRIVATE_KEY`
            *   **Important:** Copy the *entire* private key string from the JSON file, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` markers.
            *   When pasting into the `.env.local` file, you **must** replace the literal newline characters (`\n`) within the key string with the characters `\\n`. For example: `"-----BEGIN PRIVATE KEY-----\\nYOUR_KEY_LINE_1\\nYOUR_KEY_LINE_2\\n-----END PRIVATE KEY-----\\n"`

    **ESP32 API Key:**
    *   Generate a strong, random string to use as an API key for authenticating requests from your ESP32 devices. Put this value in `ESP32_API_KEY`.

    **Email Service Configuration (Nodemailer):**
    *   Configure the SMTP credentials for sending emails (e.g., using SendGrid, Gmail App Passwords, or another provider).
    *   `EMAIL_HOST`: Your SMTP server hostname.
    *   `EMAIL_PORT`: Your SMTP server port (e.g., 587 for TLS, 465 for SSL).
    *   `EMAIL_SECURE`: Set to `true` if using SSL (port 465), otherwise `false`.
    *   `EMAIL_USER`: Your SMTP username (often your email address or API key name).
    *   `EMAIL_PASS`: Your SMTP password or API key.
    *   `EMAIL_FROM`: The email address that emails will appear to be sent from.

    ```dotenv
    # .env.local Example (replace all YOUR_* values)

    # --- Firebase Client-Side Configuration ---
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"

    # --- Firebase Admin SDK Configuration (Server-Side Only!) ---
    FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    FIREBASE_CLIENT_EMAIL="YOUR_CLIENT_EMAIL_FROM_SERVICE_ACCOUNT_JSON"
    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_KEY_CONTENT_LINE_1\\nYOUR_KEY_CONTENT_LINE_2\\n-----END PRIVATE KEY-----\\n"

    # --- ESP32 Authentication Key ---
    ESP32_API_KEY="YOUR_GENERATED_STRONG_RANDOM_API_KEY"

    # --- Email Service Configuration (Using Nodemailer) ---
    EMAIL_HOST="YOUR_SMTP_HOST"
    EMAIL_PORT="587"
    EMAIL_SECURE="false"
    EMAIL_USER="YOUR_SMTP_USERNAME"
    EMAIL_PASS="YOUR_SMTP_PASSWORD_OR_API_KEY"
    EMAIL_FROM="YOUR_SENDER_EMAIL_ADDRESS"

    # --- Optional: Google AI API Key ---
    # GOOGLE_GENAI_API_KEY="YOUR_GOOGLE_AI_API_KEY"
    ```

    **Security Note:** The `.env.local` file contains sensitive credentials (`FIREBASE_PRIVATE_KEY`, `ESP32_API_KEY`, `EMAIL_PASS`) and should **NEVER** be committed to version control. Ensure it is listed in your `.gitignore` file.

3.  **Run the Development Server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```

    Open [http://localhost:9002](http://localhost:9002) (or the specified port) with your browser to see the result.

## Project Structure

*   `src/app/`: Core application pages and layouts (App Router).
    *   `src/app/api/`: Backend API routes (e.g., for ESP32 communication).
*   `src/components/`: Reusable UI components.
    *   `src/components/ui/`: ShadCN UI components.
    *   `src/components/auth/`: Authentication components.
    *   `src/components/map/`: Map-related components (now Station list).
    *   `src/components/donations/`: Donation components.
    *   `src/components/layout/`: Navbar, Footer.
*   `src/context/`: React Context providers (e.g., AuthContext, QueryProvider).
*   `src/hooks/`: Custom React hooks (e.g., useToast, useMobile).
*   `src/lib/`: Utility functions and library configurations.
    *   `src/lib/firebase/`: Firebase client and admin configurations.
    *   `src/lib/auth/`: Authentication utilities (e.g., ESP32 auth).
*   `src/services/`: Functions for interacting with external services (e.g., email sending).
*   `src/ai/`: Genkit AI related flows (if applicable).
*   `public/`: Static assets (images, icons).
*   `styles/`: Global styles (deprecated, use `src/app/globals.css`).

## Key Features Implemented

*   **Authentication:** User login/registration via Firebase (Email/Password, including Uniandes Code).
*   **Account Page:** View user details, active loan timer, donation status, loan history (placeholder).
*   **Donation Page:** Tiered donation info, manual donation instructions with copyable account number.
*   **Stations Page:** List of stations showing location and umbrella availability/capacity (fetched from Firestore). Error handling for fetch failures.
*   **Landing Page:** Hero, How it Works, Real-time Impact sections.
*   **Terms Page:** Static terms and conditions.
*   **Backend API for ESP32:**
    *   `/api/dispenser/request-loan`: Handles loan requests from ESP32s using Uniandes Code, validates user/station, updates Firestore, sends confirmation email.
    *   `/api/dispenser/return-loan`: Handles loan returns from ESP32s, validates user/loan, calculates fines, updates Firestore, sends confirmation/fine emails.
    *   `/api/stations`: Provides station data (including availability) for the Stations page.
*   **Email Notifications:** Sends emails for loan confirmations, returns, and fines using Nodemailer.
*   **Styling:** ShadCN UI, Tailwind CSS, Dark Mode Toggle.
*   **Firebase Integration:** Client-side auth/Firestore (using react-firebase-hooks), Server-side Admin SDK for secure backend operations.
*   **Real-time Updates:** Impact section and Stations page potentially update in real-time (depending on Firestore listeners).

## Arduino/ESP32 Integration Guide

See the separate `ARDUINO_INTEGRATION_GUIDE.md` file (or the detailed prompt response) for instructions on how to program the ESP32 to interact with the backend API endpoints (`/api/dispenser/request-loan` and `/api/dispenser/return-loan`).

