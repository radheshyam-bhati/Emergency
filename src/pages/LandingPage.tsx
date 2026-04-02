import Navbar from "@/components/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import DashboardPreviewSection from "@/components/landing/DashboardPreviewSection";
import SecuritySection from "@/components/landing/SecuritySection";
import ComplianceSection from "@/components/landing/ComplianceSection";
import CTASection from "@/components/landing/CTASection";
import { Shield } from "lucide-react";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DashboardPreviewSection />
      <SecuritySection />
      <ComplianceSection />
      <CTASection />

      <footer className="border-t border-border/50 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-mono text-sm font-bold text-foreground">
                VAGR<span className="text-primary">Hub</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2028 VAGR Hub. Verifiable Agentic GraphRAG for Financial Compliance.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
