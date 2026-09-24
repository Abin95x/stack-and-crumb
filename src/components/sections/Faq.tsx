const FAQS = [
  {
    q: "Do you have vegetarian or vegan options?",
    a: "Yes. The Garden Variety burger runs on a beet & black bean patty, and the Crispy Tofu roll is vegan if you swap the sesame mayo for our chili oil. Sides are all vegetarian.",
  },
  {
    q: "Is the bread really made in-house?",
    a: "Every bun and every roll, twice a day. If we run out, we run out — we'd rather apologise than serve you yesterday's bread.",
  },
  {
    q: "Can you feed a crowd?",
    a: "We do party trays of halved long rolls and slider stacks for groups of 10 to 80. Give us 48 hours' notice and we'll handle the rest.",
  },
  {
    q: "Do you deliver?",
    a: "Within about 5 km through the usual delivery apps. Honestly though, a long roll is at its crackliest in the first ten minutes, so pickup is the pro move.",
  },
  {
    q: "What about allergies?",
    a: "Our kitchen handles gluten, dairy, egg, sesame, soy and peanuts. Tell us when you order and we'll change gloves, boards and grill space — but we can't promise zero cross-contact.",
  },
  {
    q: "Can I customise my order?",
    a: "Please do. Scroll up and build it in 3D if you like — we'll stack it exactly like that.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="bg-paper-2 py-28 sm:py-36">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.6fr]">
        <div data-reveal>
          <p className="eyebrow mb-4 text-tomato">Good questions</p>
          <h2 className="display text-[clamp(3rem,8vw,6.5rem)]">
            Asked
            <br />
            <span className="accent text-crust">&amp; answered.</span>
          </h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <details
              data-reveal
              key={f.q}
              open={i === 0}
              className="group rounded-3xl border-2 border-ink bg-paper px-6 py-5 open:shadow-[5px_5px_0_var(--color-ink)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 [&::-webkit-details-marker]:hidden">
                <span className="display text-xl leading-tight sm:text-2xl">{f.q}</span>
                <span
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink text-xl transition-transform group-open:rotate-45 group-open:bg-mustard"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl leading-relaxed text-ink/70">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
