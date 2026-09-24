import Image from "next/image";

const DAY = [
  { time: "4:30", unit: "am", title: "First bake", body: "Rolls and buns go in while the street is still dark." },
  { time: "7:00", unit: "am", title: "Pickles jarred", body: "Carrot, daikon and cucumbers into the brine for tomorrow." },
  { time: "11:00", unit: "am", title: "Doors open", body: "Flat-top's roaring. First smash of the day is ours." },
  { time: "2:30", unit: "pm", title: "Second bake", body: "Because a roll at 6pm should crackle like one at noon." },
];

const FACTS = [
  { big: "18h", small: "Pickle brine, minimum" },
  { big: "0", small: "Freezers in the kitchen" },
  { big: "2×", small: "Bakes a day, every day" },
  { big: "90s", small: "From flat-top to your hands" },
];

export default function Story() {
  return (
    <section id="bread" className="relative bg-paper py-28 sm:py-36">
      <div className="mx-auto grid max-w-7xl gap-16 px-5 sm:px-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p data-reveal className="eyebrow mb-4 text-tomato">
            Our whole philosophy
          </p>
          <h2 data-reveal className="display text-[clamp(3.2rem,9vw,8rem)]">
            Bread first.
            <br />
            <span className="accent text-crust">Always.</span>
          </h2>
          <div data-reveal className="mt-8 max-w-lg space-y-4 text-lg leading-relaxed text-ink/75">
            <p>
              A sandwich is only as good as the thing holding it together. So before we sorted out a single sauce, we
              spent a winter getting the bread right: a pillowy potato bun that toasts without drying out, and a
              rice-flour roll with a crust that shatters and an inside like a cloud.
            </p>
            <p>
              Everything else — the smash, the brine, the herbs — is just us trying to be worthy of it.
            </p>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FACTS.map((f) => (
              <div data-reveal key={f.small} className="rounded-3xl border-2 border-ink bg-paper-2 p-4">
                <dt className="sr-only">{f.small}</dt>
                <dd>
                  <span className="display block text-5xl text-tomato">{f.big}</span>
                  <span className="mt-1 block text-sm leading-snug text-ink/70">{f.small}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <Image
            src="/art/stamp.svg"
            alt=""
            width={150}
            height={150}
            className="absolute -top-10 -right-2 z-10 animate-spin-slow sm:-right-8"
          />
          <ol className="relative rounded-[2.5rem] border-2 border-ink bg-ink p-7 text-paper shadow-[8px_8px_0_var(--color-mustard)] sm:p-10">
            <li className="eyebrow mb-6 text-mustard">A day in the kitchen</li>
            {DAY.map((d, i) => (
              <li data-reveal key={d.title} className={`grid grid-cols-[5.5rem_1fr] gap-4 py-5 ${i ? "border-t border-paper/15" : ""}`}>
                <span className="display text-4xl leading-none text-mustard">
                  {d.time}
                  <span className="accent ml-0.5 text-lg text-paper/60">{d.unit}</span>
                </span>
                <span>
                  <span className="display block text-2xl leading-none">{d.title}</span>
                  <span className="mt-1.5 block text-paper/65">{d.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
