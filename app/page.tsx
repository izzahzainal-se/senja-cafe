import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Menu from "@/components/Menu";
import Reservation from "@/components/Reservation";

export default function Home() {
  return (
    <main id="top">
      <Navbar />
      <Hero />
      <Menu />
      <Reservation />
    </main>
  );
}