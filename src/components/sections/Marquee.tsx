import Image from "next/image";

const WORDS = ["Toast it", "Stack it", "Squash it", "Love it", "Repeat"];

export default function Marquee() {
  const row = [...WORDS, ...WORDS];
  return (
    <div className="relative z-10 -my-6 overflow-hidden py-6" aria-hidden>
      <div className="-rotate-2 border-y-2 border-ink bg-mustard py-4">
        <div className="flex w-max animate-marquee">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {row.map((w, i) => (
                <span key={i} className="flex items-center">
                  <span className="display px-6 text-4xl whitespace-nowrap text-ink uppercase sm:text-6xl">{w}</span>
                  <Image src="/art/icon.svg" alt="" width={44} height={44} className="rotate-12 rounded-xl" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
