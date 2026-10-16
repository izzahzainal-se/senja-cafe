"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { calcTotals, SERVICE_CHARGE_RATE, SST_RATE } from "@/lib/pricing";
import type { Branch, CartLine, OrderType } from "@/lib/types";
import SenjaSun from "./SenjaSun";

const fmt = (n: number) => `RM ${Number(n).toFixed(2)}`;
const pct = (r: number) => `${Math.round(r * 100)}%`;

type Step = "cart" | "review" | "done";

type Props = {
  open: boolean;
  onClose: () => void;
  cart: CartLine[];
  setQty: (id: string, q: number) => void;
  clearCart: () => void;
  branch?: Branch;
  orderType: OrderType;
};

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-4 py-0.5">
      <span className="text-midnight/60">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

export default function CartDrawer({ open, onClose, cart, setQty, clearCart, branch, orderType }: Props) {
  const [step, setStep] = useState<Step>("cart");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [table, setTable] = useState("");
  const [pickup, setPickup] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<{ id: string; total: number } | null>(null);

  useEffect(() => setTable(""), [branch?.id]);

  const totals = calcTotals(cart, orderType);
  const tables = Array.from({ length: branch?.table_count ?? 0 }, (_, i) => String(i + 1));

  function pickupDate() {
    const [h, m] = pickup.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }

  // Step 1 → 2: check form, then tunjuk receipt
  function goReview(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!branch) return setError("Please pick a branch first.");
    if (orderType === "dine_in" && !table) return setError("Please pick your table.");
    if (orderType === "takeaway" && pickupDate().getTime() < Date.now() + 10 * 60 * 1000) {
      return setError("Pickup time must be at least 10 minutes from now.");
    }
    setStep("review");
  }

  // Step 2 → 3: hantar ke database
  async function placeOrder() {
    if (!branch) return;
    setError("");
    setSubmitting(true);
    const { data, error } = await supabase.rpc("place_order", {
      p_branch_id: branch.id,
      p_order_type: orderType,
      p_customer_name: name,
      p_phone: orderType === "takeaway" ? phone : null,
      p_table_number: orderType === "dine_in" ? table : null,
      p_pickup_time: orderType === "takeaway" ? pickupDate().toISOString() : null,
      p_items: cart.map((l) => ({ menu_item_id: l.item.id, quantity: l.quantity })),
    });
    setSubmitting(false);

    if (error) return setError(error.message);
    setPlaced(data as { id: string; total: number });
    setStep("done");
    clearCart();
  }

  function close() {
    onClose();
    setTimeout(() => {
      setStep("cart");
      setPlaced(null);
      setError("");
    }, 400);
  }

  const input = "w-full rounded-xl border border-rust/20 bg-transparent px-4 py-3 text-sm outline-none focus:border-ember";
  const dashed = <div className="my-4 border-t border-dashed border-midnight/30" />;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-50 bg-midnight/50 backdrop-blur-sm"
          />
          <motion.aside
            data-lenis-prevent
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-cream text-rust shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-rust/10 p-6">
              <div>
                <h3 className="font-serif text-2xl">
                  {step === "review" ? "Review your order" : "Your order"}
                </h3>
                <p className="text-xs text-rust/60">
                  {branch?.name} · {orderType === "dine_in" ? "Dine in" : "Takeaway"}
                </p>
              </div>
              <button onClick={close} aria-label="Close" className="text-2xl">×</button>
            </div>

            {/* STEP 3: DONE */}
            {step === "done" && placed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-1 flex-col items-center justify-center p-8 text-center"
              >
                <SenjaSun className="w-20 text-rust" />
                <h4 className="mt-6 font-serif text-3xl">Terima kasih!</h4>
                <p className="mt-2 text-sm text-rust/70">
                  Order <span className="font-semibold">#{placed.id.slice(0, 6).toUpperCase()}</span> received.
                </p>
                <p className="mt-1 text-sm text-rust/70">Total {fmt(placed.total)}</p>
                <p className="mt-1 text-sm text-rust/70">
                  {orderType === "dine_in" ? `We'll bring it to table ${table}.` : `Ready for pickup at ${pickup}.`}
                </p>
              </motion.div>
            ) : cart.length === 0 ? (
              <p className="flex flex-1 items-center justify-center text-sm text-rust/60">Your order is empty.</p>
            ) : step === "review" ? (
              /* STEP 2: RECEIPT */
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto bg-sand/30 p-6">
                  <motion.div
                    initial={{ clipPath: "inset(0 0 100% 0)" }}
                    animate={{ clipPath: "inset(0 0 0% 0)" }}
                    transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
                    className="mx-auto max-w-sm bg-white px-6 py-8 font-mono text-xs text-midnight shadow-lg"
                  >
                    <div className="text-center text-rust">
                      <SenjaSun className="mx-auto w-12" />
                      <p className="mt-2 font-serif text-2xl">Senja.</p>
                      <p className="text-[10px] uppercase tracking-[0.3em]">Coffee for the golden hour</p>
                    </div>

                    {dashed}
                    <Row label="Branch" value={branch?.name} />
                    <Row
                      label="Date"
                      value={new Date().toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" })}
                    />
                    <Row label="Type" value={orderType === "dine_in" ? "Dine in" : "Takeaway"} />
                    {orderType === "dine_in" ? (
                      <Row label="Table" value={table} />
                    ) : (
                      <>
                        <Row label="Pickup" value={`Today, ${pickup}`} />
                        <Row label="Phone" value={phone} />
                      </>
                    )}
                    <Row label="Name" value={name} />

                    {dashed}
                    {cart.map((l) => (
                      <div key={l.item.id} className="py-1">
                        <div className="flex justify-between gap-4">
                          <span>{l.item.name}</span>
                          <span>{fmt(Number(l.item.price) * l.quantity)}</span>
                        </div>
                        <p className="text-midnight/50">
                          {l.quantity} × {fmt(l.item.price)}
                        </p>
                      </div>
                    ))}

                    {dashed}
                    <Row label="Subtotal" value={fmt(totals.subtotal)} />
                    {totals.serviceCharge > 0 && (
                      <Row label={`Service charge (${pct(SERVICE_CHARGE_RATE)})`} value={fmt(totals.serviceCharge)} />
                    )}
                    <Row label={`SST (${pct(SST_RATE)})`} value={fmt(totals.sst)} />

                    {dashed}
                    <div className="flex justify-between text-base font-bold">
                      <span>TOTAL</span>
                      <span>{fmt(totals.total)}</span>
                    </div>

                    <p className="mt-6 text-center text-[10px] text-midnight/50">
                      Please double check before confirming.
                    </p>
                  </motion.div>
                </div>

                {/* Footer: breakdown + total sentiasa nampak */}
                <div className="space-y-3 border-t border-rust/10 p-6">
                  {error && <p className="text-sm text-red-700">{error}</p>}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-rust/60">
                      <span>Subtotal</span>
                      <span>{fmt(totals.subtotal)}</span>
                    </div>
                    {totals.serviceCharge > 0 && (
                      <div className="flex justify-between text-rust/60">
                        <span>Service charge ({pct(SERVICE_CHARGE_RATE)})</span>
                        <span>{fmt(totals.serviceCharge)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-rust/60">
                      <span>SST ({pct(SST_RATE)})</span>
                      <span>{fmt(totals.sst)}</span>
                    </div>
                    <div className="flex items-baseline justify-between pt-2">
                      <span className="text-xs uppercase tracking-[0.2em]">Total</span>
                      <span className="font-serif text-3xl">{fmt(totals.total)}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep("cart")}
                      className="flex-1 rounded-full border border-rust/30 py-4 text-sm uppercase tracking-[0.2em] transition-colors hover:border-ember hover:text-ember"
                    >
                      Edit
                    </button>
                    <button
                      onClick={placeOrder}
                      disabled={submitting}
                      className="flex-[2] rounded-full bg-rust py-4 text-sm uppercase tracking-[0.2em] text-cream transition-colors hover:bg-ember disabled:opacity-50"
                    >
                      {submitting ? "Placing…" : "Confirm order"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* STEP 1: CART + DETAILS */
              <form onSubmit={goReview} className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                  <ul className="space-y-4 p-6">
                    {cart.map((l) => (
                      <motion.li layout key={l.item.id} className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-serif">{l.item.name}</p>
                          <p className="text-xs text-rust/60">{fmt(l.item.price)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => setQty(l.item.id, l.quantity - 1)} className="h-8 w-8 rounded-full border border-rust/20">−</button>
                          <span className="w-4 text-center text-sm">{l.quantity}</span>
                          <button type="button" onClick={() => setQty(l.item.id, l.quantity + 1)} className="h-8 w-8 rounded-full border border-rust/20">+</button>
                        </div>
                      </motion.li>
                    ))}
                  </ul>

                  <div className="space-y-4 border-t border-rust/10 p-6">
                    <input required placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className={input} />

                    <AnimatePresence mode="wait">
                      {orderType === "dine_in" ? (
                        <motion.div key="dine" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-rust/60">Pick your table</p>
                          <div className="grid grid-cols-5 gap-2">
                            {tables.map((t) => (
                              <motion.button
                                type="button"
                                key={t}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setTable(t)}
                                className={`aspect-square rounded-xl border text-sm transition-colors ${
                                  table === t ? "border-rust bg-rust text-cream" : "border-rust/20 hover:border-ember hover:text-ember"
                                }`}
                              >
                                {t}
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="takeaway" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
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
                          <label className="block text-xs text-rust/60">
                            Pickup time (today)
                            <input required type="time" value={pickup} onChange={(e) => setPickup(e.target.value)} className={`${input} mt-1`} />
                          </label>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-3 border-t border-rust/10 p-6">
                  {error && <p className="text-sm text-red-700">{error}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-rust/60">Subtotal</span>
                    <span className="font-serif text-2xl">{fmt(totals.subtotal)}</span>
                  </div>
                  <p className="text-xs text-rust/50">
                    {orderType === "dine_in" ? "Service charge & SST" : "SST"} calculated on the next step.
                  </p>
                  <button className="w-full rounded-full bg-rust py-4 text-sm uppercase tracking-[0.2em] text-cream transition-colors hover:bg-ember">
                    Review order
                  </button>
                </div>
              </form>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}