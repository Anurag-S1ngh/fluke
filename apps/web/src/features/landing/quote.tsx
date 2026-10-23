export function Quote() {
  return (
    <section className="relative overflow-hidden border-b-2 border-foreground bg-signal text-background">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(currentColor_1px,transparent_1px)] text-background opacity-20 [background-size:6px_6px]"
      />
      <div className="relative mx-auto max-w-4xl px-6 py-32 text-center sm:py-44">
        <blockquote className="font-serif text-[clamp(2rem,5vw,3.75rem)] leading-[1.05] text-balance">
          “A price is an opinion that has <em>skin in the game</em>.”
        </blockquote>
      </div>
    </section>
  );
}
