"use client";
import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import SenjaSun from "./SenjaSun";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STARS = [
  [12, 18], [25, 8], [40, 22], [62, 12], [78, 25],
  [88, 10], [70, 35], [18, 35], [52, 6], [93, 30],
];

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(".hero-reveal", {
        y: 40, opacity: 0, duration: 1.2, ease: "power3.out", stagger: 0.15,
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=150%",
          scrub: 1,
          pin: true,
        },
      });

      tl.to(".scroll-hint", { opacity: 0, ease: "none" }, 0)
        .to(".sky-sunset", { opacity: 1, ease: "none" }, 0)
        .to(".sun", { y: 14, ease: "none" }, 0)
        .to(".sky-night", { opacity: 1, ease: "none" }, 1)
        .to(".sun", { y: 50, ease: "none" }, 1)
        .to(".hero-ink", { color: "#F5ECE2", ease: "none" }, 1)
        .to(".star", { opacity: 1, stagger: 0.05, ease: "none" }, 1.3)
        .to(".night-line", { opacity: 1, y: 0, ease: "none" }, 1.5);
    },
    { scope: root }
  );

  return (
    // Wrapper ni penting: GSAP pin ubah DOM dalam kotak ni je, React tak keliru
    <div>
      <section ref={root} className="relative h-screen overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-cream to-sand" />
        <div className="sky-sunset absolute inset-0 opacity-0 bg-linear-to-b from-glow to-ember" />
        <div className="sky-night absolute inset-0 opacity-0 bg-linear-to-b from-dusk to-midnight" />

        {STARS.map(([x, y], i) => (
          <span
            key={i}
            className="star absolute h-1 w-1 rounded-full bg-cream opacity-0"
            style={{ left: `${x}%`, top: `${y}%` }}
          />
        ))}

        <div className="hero-ink relative z-10 flex h-full flex-col items-center justify-center px-4 text-center text-rust">
          <SenjaSun className="hero-reveal mb-6 w-28 md:w-36" />
          <h1 className="hero-reveal font-serif text-7xl tracking-tight md:text-9xl">
            Senja<span className="text-ember">.</span>
          </h1>
          <p className="hero-reveal mt-6 text-xs uppercase tracking-[0.4em] md:text-sm">
            Coffee for the golden hour
          </p>
          <p className="night-line mt-10 translate-y-4 font-serif text-lg italic opacity-0 md:text-xl">
            Senja pergi, kopi menanti.
          </p>
        </div>

        <div className="scroll-hint absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-rust">
          Scroll
        </div>
      </section>
    </div>
  );
}