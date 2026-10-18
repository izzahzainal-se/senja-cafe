"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { Branch } from "@/lib/types";
import SenjaSun from "./SenjaSun";

// ⚠️ Ganti dengan maklumat sebenar sebelum share
const CONTACT = {
  email: "hello@senja.example.com",
  phone: "+60 3-0000 0000",
  whatsapp: "60000000000", // format: 60 + nombor tanpa 0 depan
};

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com/" },
  { label: "TikTok", href: "https://tiktok.com/" },
  { label: "Facebook", href: "https://facebook.com/" },
];

const LINKS = [
  { href: "#menu", label: "Menu" },
  { href: "#reserve", label: "Reservations" },
];

const mapUrl = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

export default function Footer() {
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    supabase
      .from("branches")
      .select("*")
      .order("name")
      .then(({ data }) => data && setBranches(data));
  }, []);

  const heading = "text-xs uppercase tracking-[0.3em] text-cream/40";
  const link = "text-sm text-cream/70 transition-colors hover:text-glow";

  return (
    <footer className="relative overflow-hidden bg-midnight text-cream">
      <div className="mx-auto max-w-6xl px-4 pt-16 md:pt-24">
        {/* CTA */}
        <div className="flex flex-col items-start justify-between gap-8 border-b border-cream/10 pb-14 md:flex-row md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-glow">Visit us</p>
            <h2 className="mt-4 max-w-xl font-serif text-4xl sm:text-5xl">Come for the coffee, stay for the sunset.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="#reserve" className="rounded-full bg-glow px-6 py-3 text-sm text-midnight transition-colors hover:bg-cream">
              Book a table
            </a>
            <a
              href={`https://wa.me/${CONTACT.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-6 py-3 text-sm ring-1 ring-cream/30 transition-colors hover:text-glow hover:ring-glow"
            >
              WhatsApp us
            </a>
          </div>
        </div>

        {/* Branches */}
        <div className="grid gap-10 border-b border-cream/10 py-14 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <p className={heading}>{b.city}</p>
              <h3 className="mt-2 font-serif text-2xl">{b.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-cream/70">{b.address}</p>
              <p className="mt-2 text-sm text-cream/70">{b.opening_hours}</p>
              {b.phone && (
                <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} className={`mt-2 block ${link}`}>
                  {b.phone}
                </a>
              )}
              <a
                href={mapUrl(b.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-4 inline-flex items-center gap-2 text-sm text-glow"
              >
                Get directions <span className="transition-transform group-hover:translate-x-1">→</span>
              </a>
            </motion.div>
          ))}
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 gap-10 py-14 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <SenjaSun className="w-10" />
              <span className="font-serif text-3xl">Senja.</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-cream/60">
              Specialty coffee and brunch, made for slow evenings.
            </p>
          </div>

          <div>
            <p className={heading}>Explore</p>
            <ul className="mt-4 space-y-2">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className={link}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <p className={heading}>Contact</p>
            <ul className="mt-4 space-y-2">
              <li>
                <a href={`mailto:${CONTACT.email}`} className={`break-all ${link}`}>{CONTACT.email}</a>
              </li>
              <li>
                <a href={`tel:${CONTACT.phone.replace(/[^\d+]/g, "")}`} className={link}>{CONTACT.phone}</a>
              </li>
              <li>
                <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer" className={link}>
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className={heading}>Follow</p>
            <ul className="mt-4 space-y-2">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className={link}>{s.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Wordmark + matahari terbit */}
      <div className="relative mx-auto max-w-6xl overflow-hidden px-4">
        <motion.div
          initial={{ y: "70%" }}
          whileInView={{ y: "10%" }}
          viewport={{ once: true }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute inset-x-0 top-0 mx-auto aspect-square w-[45vw] max-w-sm rounded-full bg-linear-to-b from-glow to-ember opacity-80 blur-[2px]"
        />
        <p className="relative select-none text-center font-serif text-[28vw] leading-none tracking-tighter text-cream/10 lg:text-[18rem]">
          Senja.
        </p>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-cream/10 bg-midnight">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-cream/40 sm:flex-row">
          <p>© 2026 Senja Coffee. All rights reserved.</p>
          <p className="font-serif italic">Senja pergi, kopi menanti.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-glow">Privacy</a>
            <a href="#" className="hover:text-glow">Terms</a>
            <a href="#top" className="hover:text-glow">Back to top ↑</a>
          </div>
        </div>
      </div>
    </footer>
  );
}