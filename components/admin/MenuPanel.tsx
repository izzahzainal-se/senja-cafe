"use client";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { MenuItem } from "@/lib/types";
import MenuForm from "./MenuForm";

const fmt = (n: number) => `RM ${Number(n).toFixed(2)}`;

function Switch({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} aria-label={label} className="flex items-center gap-2 text-xs">
      <span className={`relative h-5 w-9 rounded-full transition-colors ${on ? "bg-rust" : "bg-mist/50"}`}>
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-cream ${on ? "right-0.5" : "left-0.5"}`}
        />
      </span>
      <span className="hidden text-rust/60 sm:inline">{label}</span>
    </button>
  );
}

export default function MenuPanel() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("menu_items").select("*").order("category").order("name");
    if (data) setItems(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function toggle(item: MenuItem, field: "is_available" | "is_signature") {
    const value = !item[field];
    setItems((is) => is.map((i) => (i.id === item.id ? { ...i, [field]: value } : i)));
    const { error } = await supabase.from("menu_items").update({ [field]: value }).eq("id", item.id);
    if (error) {
      notify(error.message);
      load();
    }
  }

  async function remove(item: MenuItem) {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", item.id);
    if (error) {
      notify(error.code === "23503" ? "This item has past orders. Mark it sold out instead." : error.message);
      return;
    }
    setItems((is) => is.filter((i) => i.id !== item.id));
    notify("Item deleted");
  }

  const visible = items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-4xl">Menu</h2>
          <p className="text-sm text-rust/60">{items.length} items</p>
        </div>
        <div className="flex gap-3">
          <input
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-full border border-rust/20 bg-transparent px-4 py-2 text-sm outline-none focus:border-ember"
          />
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="rounded-full bg-rust px-5 py-2 text-sm text-cream hover:bg-ember"
          >
            + New item
          </button>
        </div>
      </div>

      <motion.ul layout className="mt-8 divide-y divide-rust/10 rounded-3xl bg-white/60 ring-1 ring-rust/10">
        <AnimatePresence initial={false}>
          {visible.map((item) => (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-wrap items-center gap-4 p-4"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-linear-to-br from-rust to-ember font-serif text-xl text-cream/70">
                {item.image_url ? <img src={item.image_url} alt="" className="h-full w-full object-cover" /> : item.name[0]}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-lg">
                  {item.name} {item.is_signature && <span className="text-ember">★</span>}
                </p>
                <p className="text-xs capitalize text-rust/60">
                  {item.category} · {fmt(item.price)}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Switch on={item.is_available} onClick={() => toggle(item, "is_available")} label="Available" />
                <Switch on={item.is_signature} onClick={() => toggle(item, "is_signature")} label="Signature" />
                <button
                  onClick={() => {
                    setEditing(item);
                    setFormOpen(true);
                  }}
                  className="text-sm hover:text-ember"
                >
                  Edit
                </button>
                <button onClick={() => remove(item)} className="text-sm text-rust/50 hover:text-red-700">
                  Delete
                </button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      <MenuForm
        open={formOpen}
        item={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(msg) => {
          notify(msg);
          load();
        }}
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-midnight px-6 py-3 text-sm text-cream shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}