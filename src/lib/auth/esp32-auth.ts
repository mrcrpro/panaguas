
import type { NextRequest } from 'next/server';

// Store the expected API key securely in environment variables
const EXPECTED_API_KEY = process.env.ESP32_API_KEY;

if (!EXPECTED_API_KEY) {
    console.warn("ESP32_API_KEY environment variable is not set. ESP32 authentication will fail.");
}

/**
 * Authenticates an incoming request presumably from an ESP32.
 * Currently uses a simple API Key strategy.
 *
 * @param request The NextRequest object.
 * @returns True if the request is authenticated, false otherwise.
 */
export function authenticateEsp32Request(request: NextRequest): boolean {
    if (!EXPECTED_API_KEY) {
        console.error("Cannot authenticate ESP32 request: ESP32_API_KEY is not configured on the server.");
        return false;
    }

    const apiKey = request.headers.get('X-API-Key');

    if (!apiKey) {
        console.warn('ESP32 Authentication failed: Missing X-API-Key header.');
        return false;
    }

    if (apiKey !== EXPECTED_API_KEY) {
        console.warn('ESP32 Authentication failed: Invalid API Key.');
        return false;
    }

    // Add more sophisticated checks if needed (e.g., JWT validation)
    return true;
}

// TODO: Consider implementing JWT or mTLS for enhanced security later.
