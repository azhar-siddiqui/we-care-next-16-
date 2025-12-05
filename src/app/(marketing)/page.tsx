import Features from "./_components/features";
import MarketingHero from "./_components/hero";
import MarketingHeader from "./_components/marketing-header";
import Trusted from "./_components/trusted";

export default function Home() {
  return (
    <>
      {/* Header */}
      <MarketingHeader />
      {/* Hero Section */}
      <MarketingHero />
      {/* Trusted By Section */}
      <Trusted />
      {/* Features Section */}
      <Features />
    </>
  );
}
