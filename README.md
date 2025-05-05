
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
    *   Open `.env.local` and replace the placeholder values with your actual Firebase project credentials and a secure API key for ESP32 communication.

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

    ```dotenv
    # .env.local Example (replace all YOUR_* values)

    # Firebase Client-Side Configuration
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"

    # Firebase Admin SDK Configuration (Server-Side Only!)
    FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    FIREBASE_CLIENT_EMAIL="YOUR_CLIENT_EMAIL_FROM_SERVICE_ACCOUNT_JSON"
    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_KEY_CONTENT_LINE_1\\nYOUR_KEY_CONTENT_LINE_2\\n-----END PRIVATE KEY-----\\n"

    # ESP32 Authentication Key
    ESP32_API_KEY="YOUR_GENERATED_STRONG_RANDOM_API_KEY"

    # Optional: Google AI API Key
    # GOOGLE_GENAI_API_KEY="YOUR_GOOGLE_AI_API_KEY"
    ```

    **Security Note:** The `.env.local` file contains sensitive credentials (`FIREBASE_PRIVATE_KEY`, `ESP32_API_KEY`) and should **NEVER** be committed to version control. Ensure it is listed in your `.gitignore` file.

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
    *   `src/components/map/`: Map-related components.
    *   `src/components/donations/`: Donation components.
    *   `src/components/layout/`: Navbar, Footer.
*   `src/context/`: React Context providers (e.g., AuthContext).
*   `src/hooks/`: Custom React hooks (e.g., useToast, useMobile).
*   `src/lib/`: Utility functions and library configurations.
    *   `src/lib/firebase/`: Firebase client and admin configurations.
    *   `src/lib/auth/`: Authentication utilities (e.g., ESP32 auth).
*   `src/services/`: Functions for interacting with external services (e.g., donation processing).
*   `src/ai/`: Genkit AI related flows (if applicable).
*   `public/`: Static assets (images, icons).
*   `styles/`: Global styles (deprecated, use `src/app/globals.css`).

## Key Features Implemented

*   **Authentication:** User login/registration via Firebase (Email/Password).
*   **Account Page:** View user details, donation status, loan history (placeholder).
*   **Donation Page:** Tiered donation options with dialog form.
*   **Map Page:** Interactive Leaflet map displaying station locations (availability placeholder).
*   **Landing Page:** Hero, How it Works, Impact sections.
*   **Terms Page:** Static terms and conditions.
*   **Backend API for ESP32:**
    *   `/api/dispenser/request-loan`: Handles loan requests from ESP32s.
    *   `/api/dispenser/return-loan`: Handles loan returns from ESP32s.
    *   `/api/stations`: Provides station data (including availability) for the map.
*   **Styling:** ShadCN UI, Tailwind CSS, Dark Mode Toggle.
*   **Firebase Integration:** Client-side auth/Firestore, Server-side Admin SDK for secure backend operations.
