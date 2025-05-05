
import type { NextRequest } from 'next/server';

// Store the expected API key securely in environment variables
const EXPECTED_API_KEY = process.env.ESP32_API_KEY;

if (!EXPECTED_API_KEY) {
    console.warn("CRITICAL WARNING: ESP32_API_KEY environment variable is not set. ESP32 authentication WILL FAIL.");
}

/**
 * Authenticates an incoming request presumably from an ESP32 device.
 * Uses a simple API Key strategy expecting the key in the 'X-ESP32-API-Key' header.
 *
 * @param request The NextRequest object.
 * @returns True if the request is authenticated, false otherwise.
 */
export function authenticateEsp32Request(request: NextRequest): boolean {
    if (!EXPECTED_API_KEY) {
        console.error("ESP32 Authentication Blocked: ESP32_API_KEY is not configured on the server.");
        return false;
    }

    const apiKey = request.headers.get('X-ESP32-API-Key'); // Use a specific header name

    if (!apiKey) {
        console.warn(`ESP32 Authentication Failed: Missing X-ESP32-API-Key header. Request URL: ${request.url}`);
        return false;
    }

    // Securely compare keys (timing-attack resistant comparison isn't strictly necessary here, but good practice if sensitive)
    // Basic string comparison is usually sufficient for API keys unless under extreme security scrutiny.
    if (apiKey !== EXPECTED_API_KEY) {
        console.warn(`ESP32 Authentication Failed: Invalid API Key provided. Request URL: ${request.url}`);
        // Avoid logging the invalid key itself unless for specific debugging scenarios
        return false;
    }

    console.log(`ESP32 Authentication Succeeded for request to: ${request.url}`);
    return true;
}

// TODO: Consider implementing JWT or mTLS for enhanced security in future iterations.
// JWT: Backend issues short-lived tokens to ESP32s upon startup/registration.
// mTLS: Requires managing certificates on both backend and ESP32 devices.
