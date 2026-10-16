"use client";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import AdminLogin from "@/components/admin/AdminLogin";
import OrdersPanel from "@/components/admin/OrdersPanel";
import ReservationsPanel from "@/components/admin/ReservationsPanel";
import MenuPanel from "@/components/admin/MenuPanel";
import SenjaSun from "@/components/SenjaSun";

type Tab = "orders" | "bookings" | "menu";

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("orders");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <div className="min-h-screen bg-cream" />;
  if (!session) return <AdminLogin />;

  return (
    <div className="min-h-screen bg-cream text-rust">
      <header className="sticky top-0 z-30 border-b border-rust/10 bg-cream/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <SenjaSun className="w-10" />
            <span className="font-serif text-2xl">Senja.</span>
            <span className="rounded-full bg-rust/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]">Admin</span>
          </div>

          <nav className="flex rounded-full border border-rust/20 p-1">
            {(["orders", "bookings", "menu"] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)} className="relative px-4 py-1.5 text-sm capitalize sm:px-5">
                {tab === t && (
                  <motion.span
                    layoutId="admin-tab"
                    className="absolute inset-0 rounded-full bg-rust"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 transition-colors ${tab === t ? "text-cream" : ""}`}>{t}</span>
              </button>
            ))}
          </nav>

          <button onClick={() => supabase.auth.signOut()} className="text-sm text-rust/60 hover:text-ember">
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        {tab === "orders" && <OrdersPanel />}
        {tab === "bookings" && <ReservationsPanel />}
        {tab === "menu" && <MenuPanel />}
      </main>
    </div>
  );
}