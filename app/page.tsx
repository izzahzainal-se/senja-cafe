import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Menu from "@/components/Menu";
import Reservation from "@/components/Reservation";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main id="top">
      <Navbar />
      <Hero />
      <Menu />
      <Reservation />
      <Footer />
    </main>
  );
}