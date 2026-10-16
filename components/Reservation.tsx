"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { Branch } from "@/lib/types";
import SenjaSun from "./SenjaSun";

const DAYS_AHEAD = 14;
const FIRST_HOUR = 10; // slot pertama 10:00
const LAST_HOUR = 21; // slot terakhir 21:00
const MAX_GUESTS = 12;

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtDay = (d: Date) => d.toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" });
const fmtTime = (d: Date) => d.toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit" });

function buildSlots(day: Date) {
  const slots: Date[] = [];
  for (let h = FIRST_HOUR; h <= LAST_HOUR; h++) {
    for (const m of [0, 30]) {
      if (h === LAST_HOUR && m === 30) continue;
      const d = new Date(day);
      d.setHours(h, m, 0, 0);
      slots.push(d);
    }
  }
  return slots;
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-cream/50">
        <span className="font-serif text-base text-glow">{n}</span>
        {title}
      </p>
      {children}
    </div>
  );
}

export default function Reservation() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");
  const [days, setDays] = useState<Date[]>([]);
  const [day, setDay] = useState<Date | null>(null);
  const [party, setParty] = useState(2);
  const [slot, setSlot] = useState<Date | null>(null);
  const [full, setFull] = useState<number[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [now, setNow] = useState(0);

  // Masa semasa dibaca kat browser je, update setiap minit
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Tarikh dikira kat browser (elak beza timezone dengan server)
  useEffect(() => {
    const list = Array.from({ length: DAYS_AHEAD }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + i);
      return d;
    });
    setDays(list);
    setDay(list[0]);
    supabase
      .from("branches")
      .select("*")
      .order("name")
      .then(({ data }) => {
        if (data) {
          setBranches(data);
          setBranchId(data[0]?.id ?? "");
        }
      });
  }, []);

  // Ambil slot penuh bila tukar branch / tarikh
  useEffect(() => {
    if (!branchId || !day) return;
    setSlot(null);
    supabase.rpc("full_slots", { p_branch_id: branchId, p_day: ymd(day) }).then(({ data }) => {
      setFull(((data as { slot: string }[] | null) ?? []).map((r) => new Date(r.slot).getTime()));
    });
  }, [branchId, day]);

  const branch = branches.find((b) => b.id === branchId);
  const slots = day ? buildSlots(day) : [];
  const earliest = now + 60 * 60 * 1000;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!slot) return setError("Please pick a time.");

    setSubmitting(true);
    const { data, error } = await supabase.rpc("make_reservation", {
      p_branch_id: branchId,
      p_customer_name: name,
      p_phone: phone,
      p_party_size: party,
      p_reserved_at: slot.toISOString(),
      p_notes: notes,
    });
    setSubmitting(false);

    if (error) return setError(error.message);
    setBookingId(String(data));
  }

  function reset() {
    setBookingId("");
    setSlot(null);
    setNotes("");
    if (day) setDay(new Date(day)); // refresh slot penuh
  }

  const ticket: [string, string][] = [
    ["Branch", branch?.name ?? "—"],
    ["Date", day ? fmtDay(day) : "—"],
    ["Time", slot ? fmtTime(slot) : "Pick a time"],
    ["Guests", `${party} ${party === 1 ? "guest" : "guests"}`],
  ];

  const input =
    "w-full rounded-xl border border-cream/15 bg-transparent px-4 py-3 text-sm text-cream placeholder:text-cream/40 outline-none focus:border-glow";

  return (
    <section id="reserve" className="bg-midnight text-cream">
      {/* Dusk band: cream → malam */}
      <div className="h-48 bg-linear-to-b from-cream to-midnight" />

      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-32 lg:grid-cols-[1fr_1.2fr]">
        {/* Kiri: tajuk + tiket */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <p className="text-xs uppercase tracking-[0.4em] text-glow">Reservations</p>
            <h2 className="mt-4 font-serif text-5xl md:text-6xl">Save a seat for the golden hour.</h2>
            <p className="mt-4 text-cream/60">Book up to two weeks ahead. We&apos;ll hold your table for 15 minutes.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, rotate: -2, y: 30 }}
            whileInView={{ opacity: 1, rotate: 0, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-10 overflow-hidden rounded-3xl bg-cream text-rust"
          >
            <div className="flex items-center gap-3 bg-ember px-6 py-4 text-cream">
              <SenjaSun className="w-8" />
              <span className="font-serif text-xl">Senja.</span>
              <span className="ml-auto text-[10px] uppercase tracking-[0.3em]">Table ticket</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-6">
              {ticket.map(([label, value]) => (
                <div key={label}>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-rust/50">{label}</p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={value}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="font-serif text-lg"
                    >
                      {value}
                    </motion.p>
                  </AnimatePresence>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-rust/30 px-6 py-3 text-center text-[10px] uppercase tracking-[0.3em] text-rust/50">
              Senja pergi, kopi menanti
            </div>
          </motion.div>
        </div>

        {/* Kanan: form */}
        <AnimatePresence mode="wait">
          {bookingId ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center rounded-3xl p-10 text-center ring-1 ring-cream/10"
            >
              <SenjaSun className="w-20 text-glow" />
              <h3 className="mt-6 font-serif text-4xl">Jumpa nanti, {name}!</h3>
              <p className="mt-3 text-cream/70">
                Booking <span className="font-semibold text-cream">#{bookingId.slice(0, 6).toUpperCase()}</span> received
                for {party} at {branch?.name}, {day && fmtDay(day)} · {slot && fmtTime(slot)}.
              </p>
              <p className="mt-1 text-sm text-cream/50">Our team will contact you to confirm.</p>
              <button
                onClick={reset}
                className="mt-8 rounded-full border border-cream/30 px-6 py-3 text-sm hover:border-glow hover:text-glow"
              >
                Make another booking
              </button>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={submit} exit={{ opacity: 0 }} className="space-y-10">
              <Step n="01" title="Branch">
                <div className="flex flex-wrap gap-2">
                  {branches.map((b) => (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() => setBranchId(b.id)}
                      className="relative rounded-full px-5 py-2.5 text-sm ring-1 ring-cream/15"
                    >
                      {branchId === b.id && (
                        <motion.span layoutId="res-branch" className="absolute inset-0 rounded-full bg-glow" />
                      )}
                      <span className={`relative z-10 ${branchId === b.id ? "text-midnight" : ""}`}>{b.name}</span>
                    </button>
                  ))}
                </div>
              </Step>

              <Step n="02" title="Date">
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
                  {days.map((d) => {
                    const active = day?.getTime() === d.getTime();
                    return (
                      <motion.button
                        type="button"
                        key={d.getTime()}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setDay(d)}
                        className={`flex w-16 shrink-0 flex-col items-center rounded-2xl py-3 transition-colors ${
                          active ? "bg-glow text-midnight" : "ring-1 ring-cream/15 hover:ring-glow"
                        }`}
                      >
                        <span className="text-[10px] uppercase tracking-widest opacity-70">
                          {d.toLocaleDateString("en-MY", { weekday: "short" })}
                        </span>
                        <span className="font-serif text-2xl">{d.getDate()}</span>
                        <span className="text-[10px] uppercase opacity-70">
                          {d.toLocaleDateString("en-MY", { month: "short" })}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </Step>

              <Step n="03" title="Guests">
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => setParty((p) => Math.max(1, p - 1))}
                    className="h-12 w-12 rounded-full text-xl ring-1 ring-cream/20 hover:ring-glow"
                  >
                    −
                  </button>
                  <div className="relative h-14 w-16 overflow-hidden text-center">
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={party}
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -30, opacity: 0 }}
                        className="absolute inset-0 font-serif text-5xl"
                      >
                        {party}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <button
                    type="button"
                    onClick={() => setParty((p) => Math.min(MAX_GUESTS, p + 1))}
                    className="h-12 w-12 rounded-full text-xl ring-1 ring-cream/20 hover:ring-glow"
                  >
                    +
                  </button>
                  <span className="text-xs text-cream/40">Max {MAX_GUESTS}. Bigger group? Call the branch.</span>
                </div>
              </Step>

              <Step n="04" title="Time">
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {slots.map((s) => {
                    const t = s.getTime();
                    const isFull = full.includes(t);
                    const disabled = t < earliest || isFull;
                    const active = slot?.getTime() === t;
                    return (
                      <motion.button
                        type="button"
                        key={t}
                        whileTap={disabled ? undefined : { scale: 0.92 }}
                        disabled={disabled}
                        onClick={() => setSlot(s)}
                        title={isFull ? "Fully booked" : undefined}
                        className={`rounded-xl py-2.5 text-sm transition-colors ${
                          active
                            ? "bg-glow text-midnight"
                            : disabled
                            ? "text-cream/20 line-through"
                            : "ring-1 ring-cream/15 hover:ring-glow"
                        }`}
                      >
                        {fmtTime(s)}
                      </motion.button>
                    );
                  })}
                </div>
              </Step>

              <Step n="05" title="Your details">
                <div className="space-y-3">
                  <input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className={input} />
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    pattern="01[0-9]{8,9}"
                    title="Malaysian mobile number without spaces, e.g. 0123456789"
                    placeholder="Phone number (e.g. 0123456789)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className={input}
                  />
                  <textarea
                    rows={2}
                    placeholder="Notes (birthday, baby chair, window seat…)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={input}
                  />
                </div>
              </Step>

              {error && <p className="text-sm text-red-300">{error}</p>}

              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={submitting}
                className="w-full rounded-full bg-glow py-4 text-sm uppercase tracking-[0.2em] text-midnight transition-colors hover:bg-cream disabled:opacity-50"
              >
                {submitting ? "Reserving…" : "Reserve table"}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}