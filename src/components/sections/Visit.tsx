import Image from "next/image";
import { SITE } from "@/lib/site";

const HOURS = [
  ["Mon – Thu", "11am – 9pm"],
  ["Fri – Sat", "11am – 11pm"],
  ["Sunday", "12pm – 8pm"],
];

export default function Visit() {
  return (
    <section id="visit" className="relative bg-tomato py-28 text-paper sm:py-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center" data-reveal>
          <p className="eyebrow mb-4 text-ink">Find us</p>
          <h2 className="display text-[clamp(3.4rem,10vw,9rem)] text-paper">
            Come <span className="accent text-ink">hungry.</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div data-reveal className="relative overflow-hidden rounded-[2.5rem] border-2 border-ink shadow-[8px_8px_0_var(--color-ink)]">
            <Image
              src="/art/map.svg"
              alt={`Illustrated map of Stack & Crumb in ${SITE.address.join(", ")}`}
              width={600}
              height={440}
              className="h-full w-full object-cover"
            />
            <span className="display absolute top-5 left-5 -rotate-3 rounded-full border-2 border-ink bg-mustard px-4 py-1.5 text-lg text-ink">
              You&apos;re close!
            </span>
          </div>

          <div data-reveal className="flex flex-col rounded-[2.5rem] border-2 border-ink bg-paper p-8 text-ink shadow-[8px_8px_0_var(--color-ink)]">
            <p className="eyebrow text-tomato">Address</p>
            <p className="display mt-2 text-3xl leading-tight">
              {SITE.address[0]}
              <br />
              {SITE.address[1]}
            </p>
            <p className="eyebrow mt-8 text-tomato">Hours</p>
            <dl className="mt-3 divide-y-2 divide-dashed divide-ink/15">
              {HOURS.map(([d, h]) => (
                <div key={d} className="flex justify-between py-2.5">
                  <dt className="font-semibold">{d}</dt>
                  <dd className="text-ink/70">{h}</dd>
                </div>
              ))}
            </dl>
            <p className="eyebrow mt-8 text-tomato">Call ahead</p>
            <a href={`tel:${SITE.phone.tel}`} className="display mt-2 text-3xl hover:text-tomato">
              {SITE.phone.display}
            </a>
            <div className="mt-auto flex flex-wrap gap-3 pt-8">
              <a href="#menu" className="btn bg-tomato text-paper">
                Order pickup
              </a>
              <a href={SITE.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn bg-mustard text-ink">
                Get directions
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
