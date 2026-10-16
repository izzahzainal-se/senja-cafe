"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import SenjaSun from "@/components/SenjaSun";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  }

  const input = "w-full rounded-xl border border-rust/20 bg-transparent px-4 py-3 text-sm outline-none focus:border-ember";

  return (
    <div className="grid min-h-screen place-items-center bg-linear-to-b from-glow to-ember px-4">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-sm space-y-4 rounded-3xl bg-cream p-8 text-rust shadow-2xl"
      >
        <SenjaSun className="mx-auto w-16" />
        <div className="text-center">
          <h1 className="font-serif text-3xl">Staff login</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-rust/60">Senja admin</p>
        </div>
        <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
        <input required type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-full bg-rust py-3.5 text-sm uppercase tracking-[0.2em] text-cream transition-colors hover:bg-ember disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </motion.form>
    </div>
  );
}