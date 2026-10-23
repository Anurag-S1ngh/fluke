import { SiteFooter } from "@/components/layout/footer";

import { ClosingCta } from "./closing-cta";
import { Example } from "./example";
import { Faq } from "./faq";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { Quote } from "./quote";
import { Rules } from "./rules";
import { WhyPrices } from "./why-prices";

export function LandingView() {
  return (
    <main id="top" className="h-full overflow-y-auto selection:bg-signal selection:text-background">
      <Hero />
      <HowItWorks />
      <Example />
      <WhyPrices />
      <Quote />
      <Rules />
      <Faq />
      <ClosingCta />
      <SiteFooter landing />
    </main>
  );
}
