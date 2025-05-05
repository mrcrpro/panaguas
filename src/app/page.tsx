
"use client";

import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { ImpactSection } from "@/components/landing/impact-section";
// Removed unused imports: useAuth, LoginForm, WelcomeScreen
import { Toaster } from "@/components/ui/toaster"; // Keep Toaster if needed globally, or move if specific

export default function Home() {
  // const { user, loading } = useAuth(); // No longer needed here directly

  // Loading state handled by AuthProvider in layout

  return (
    <> {/* Using Fragment as main wrapper now */}
      <HeroSection />
      <HowItWorksSection />
      <ImpactSection />
      {/* Login/Welcome logic is now handled via Navbar/protected routes */}
      <Toaster /> {/* Keep if global toasts are desired */}
    </>
  );
}
