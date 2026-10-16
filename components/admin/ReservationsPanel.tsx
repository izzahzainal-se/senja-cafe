"use client";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { Branch } from "@/lib/types";

type Status = "pending" | "confirmed" | "cancelled" | "completed";

interface Booking {
  id: string;
  branch_id: string;
  customer_name: string;
  phone: string;
  party_size: number;
  reserved_at: string;
  notes: string | null;
  status: Status;
  branches: { name: string } | null;
}

const STATUS_STYLE: Record<Status, string> = {
  pending: "bg-ember text-cream",
  confirmed: "bg-dusk text-cream",
  completed: "bg-mist/40 text-midnight",
  cancelled: "bg-red-100 text-red-700",
};

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit" });
const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long" });

export default function ReservationsPanel() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("all");
  const [showCancelled, setShowCancelled] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { data, error } = await supabase
      .from("reservations")
      .select("id, branch_id, customer_name, phone, party_size, reserved_at, notes, status, branches(name)")
      .gte("reserved_at", start.toISOString())
      .order("reserved_at");
    if (error) console.error(error);
    if (data) setBookings(data as unknown as Booking[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    supabase.from("branches").select("*").order("name").then(({ data }) => data && setBranches(data));
    const channel = supabase
      .channel("reservations-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  async function setStatus(id: string, status: Status) {
    setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status } : b)));
    const { error } = await supabase.from("reservations").update({ status }).eq("id", id);
    if (error) {
      alert(error.message);
      load();
    }
  }

  const visible = bookings.filter(
    (b) => (branchId === "all" || b.branch_id === branchId) && (showCancelled || b.status !== "cancelled")
  );

  // Kumpul ikut hari
  const groups = visible.reduce<Record<string, Booking[]>>((acc, b) => {
    const key = dayLabel(b.reserved_at);
    (acc[key] ??= []).push(b);
    return acc;
  }, {});

  const pending = visible.filter((b) => b.status === "pending").length;
  const guestsToday = visible
    .filter((b) => new Date(b.reserved_at).toDateString() === new Date().toDateString() && b.status !== "cancelled")
    .reduce((s, b) => s + b.party_size, 0);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-ember p-6 text-cream">
          <p className="text-xs uppercase tracking-[0.3em] text-cream/70">Waiting to confirm</p>
          <p className="mt-2 font-serif text-5xl">{pending}</p>
        </div>
        <div className="rounded-3xl bg-midnight p-6 text-cream">
          <p className="text-xs uppercase tracking-[0.3em] text-cream/70">Guests today</p>
          <p className="mt-2 font-serif text-5xl">{guestsToday}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <select
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          className="rounded-full border border-rust/20 bg-transparent px-4 py-2 text-sm outline-none"
        >
          <option value="all">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} className="accent-rust" />
          Show cancelled
        </label>
        <span className="ml-auto flex items-center gap-2 text-xs text-rust/60">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-600" /> Live
        </span>
      </div>

      {loading ? (
        <p className="mt-10 text-sm text-rust/60">Loading bookings…</p>
      ) : visible.length === 0 ? (
        <p className="mt-10 text-sm text-rust/60">No upcoming bookings.</p>
      ) : (
        <div className="mt-8 space-y-10">
          {Object.entries(groups).map(([label, list]) => (
            <div key={label}>
              <h3 className="mb-4 font-serif text-2xl">{label}</h3>
              <motion.ul layout className="divide-y divide-rust/10 rounded-3xl bg-white/60 ring-1 ring-rust/10">
                <AnimatePresence initial={false}>
                  {list.map((b) => (
                    <motion.li
                      key={b.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-wrap items-center gap-4 p-4"
                    >
                      <div className="w-20 shrink-0 font-serif text-2xl">{time(b.reserved_at)}</div>
                      <div className="min-w-0 flex-1">
                        <p className="font-serif text-lg">
                          {b.customer_name} <span className="text-sm text-rust/50">· {b.party_size} pax</span>
                        </p>
                        <p className="text-xs text-rust/60">
                          {b.branches?.name} · {b.phone}
                        </p>
                        {b.notes && <p className="mt-1 text-xs italic text-rust/70">“{b.notes}”</p>}
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.15em] ${STATUS_STYLE[b.status]}`}>
                        {b.status}
                      </span>
                      <div className="flex gap-2">
                        {b.status === "pending" && (
                          <button onClick={() => setStatus(b.id, "confirmed")} className="rounded-full bg-rust px-4 py-1.5 text-xs text-cream hover:bg-ember">
                            Confirm
                          </button>
                        )}
                        {b.status === "confirmed" && (
                          <button onClick={() => setStatus(b.id, "completed")} className="rounded-full bg-rust px-4 py-1.5 text-xs text-cream hover:bg-ember">
                            Arrived
                          </button>
                        )}
                        {(b.status === "pending" || b.status === "confirmed") && (
                          <button onClick={() => setStatus(b.id, "cancelled")} className="rounded-full px-3 py-1.5 text-xs text-rust/60 hover:text-red-700">
                            Cancel
                          </button>
                        )}
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}