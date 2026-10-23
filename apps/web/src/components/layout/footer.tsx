import type { Route } from "next";
import Link from "next/link";

const socials = ["X", "Discord", "GitHub"];

const pages: { href: Route; label: string }[] = [
  { href: "/markets", label: "Markets" },
  { href: "/portfolio", label: "Portfolio" },
];

function SocialLinks() {
  return (
    <nav aria-label="Socials">
      <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">Socials</p>
      <ul className="mt-3 space-y-2">
        {socials.map((label) => (
          <li key={label}>
            <a href="#" className="text-sm hover:text-signal">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function PageLinks({ landing }: { landing: boolean }) {
  return (
    <nav aria-label="Pages">
      <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">Pages</p>
      <ul className="mt-3 space-y-2">
        {pages.map(({ href, label }) => (
          <li key={href}>
            <Link href={href} className="text-sm hover:text-signal">
              {label}
            </Link>
          </li>
        ))}
        {landing ? (
          <>
            <li>
              <Link href="#how-it-works" className="text-sm hover:text-signal">
                How it works
              </Link>
            </li>
            <li>
              <Link href="#example" className="text-sm hover:text-signal">
                An example
              </Link>
            </li>
            <li>
              <Link href="#the-rules" className="text-sm hover:text-signal">
                The rules
              </Link>
            </li>
            <li>
              <Link href="#faq" className="text-sm hover:text-signal">
                Questions
              </Link>
            </li>
          </>
        ) : (
          <li>
            <Link href="/#how-it-works" className="text-sm hover:text-signal">
              How it works
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

/**
 * One footer for every shell page. `landing` only changes where the section links
 * point: in-page anchors on the landing page, routes elsewhere.
 */
export function SiteFooter({ landing = false }: { landing?: boolean }) {
  return (
    <footer>
      <div className="mx-auto max-w-7xl px-6 pb-10">
        <div className="border-b-2 border-foreground py-6">
          <p className="font-serif text-[clamp(4rem,15vw,10rem)] leading-[0.8] tracking-[-0.04em]">
            fluke<span className="text-signal">.</span>
          </p>
        </div>

        <div className="grid gap-10 py-10 lg:grid-cols-[1fr_auto] lg:gap-24">
          <div>
            <p className="max-w-[36ch] text-sm leading-relaxed text-muted-foreground">
              A prediction market for real-world outcomes. YES pays $1.00, NO pays $0.00 — the price
              is the forecast.
            </p>
            <p className="mt-4 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
              © {new Date().getFullYear()} fluke
            </p>
          </div>

          <div className="grid w-fit gap-10 sm:grid-cols-[auto_auto] sm:justify-end sm:gap-16 lg:justify-self-end lg:gap-24">
            <SocialLinks />
            <PageLinks landing={landing} />
          </div>
        </div>
      </div>
    </footer>
  );
}
