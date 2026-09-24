import Nav from "@/components/Nav";
import Reveals from "@/components/Reveals";
import Builder from "@/components/sections/Builder";
import Faq from "@/components/sections/Faq";
import Footer from "@/components/sections/Footer";
import Hero from "@/components/sections/Hero";
import Marquee from "@/components/sections/Marquee";
import Menu from "@/components/sections/Menu";
import RollSection from "@/components/sections/RollSection";
import Story from "@/components/sections/Story";
import Visit from "@/components/sections/Visit";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <RollSection />
        <Menu />
        <Builder />
        <Story />
        <Visit />
        <Faq />
      </main>
      <Footer />
      <Reveals />
    </>
  );
}
