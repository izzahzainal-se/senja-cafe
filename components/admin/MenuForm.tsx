"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { Category, MenuItem } from "@/lib/types";

const BUCKET = "menu-images";
const MAX_MB = 2;

const EMPTY = {
  name: "",
  description: "",
  category: "coffee" as Category,
  price: "",
  image_url: "",
  is_signature: false,
  is_available: true,
};

type Form = typeof EMPTY;

type Props = {
  open: boolean;
  item: MenuItem | null; // null = tambah baru
  onClose: () => void;
  onSaved: (msg: string) => void;
};

export default function MenuForm({ open, item, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(
      item
        ? {
            name: item.name,
            description: item.description ?? "",
            category: item.category,
            price: String(item.price),
            image_url: item.image_url ?? "",
            is_signature: item.is_signature,
            is_available: item.is_available,
          }
        : EMPTY
    );
  }, [open, item]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function upload(file: File) {
    setError("");
    if (!file.type.startsWith("image/")) return setError("Please choose an image file.");
    if (file.size > MAX_MB * 1024 * 1024) return setError(`Image must be under ${MAX_MB} MB.`);

    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: "31536000" });
    if (error) {
      setUploading(false);
      return setError(error.message);
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    set("image_url", data.publicUrl);
    setUploading(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const price = Number(form.price);
    if (!(price >= 0)) return setError("Enter a valid price.");

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category,
      price,
      image_url: form.image_url.trim() || null,
      is_signature: form.is_signature,
      is_available: form.is_available,
    };
    const { error } = item
      ? await supabase.from("menu_items").update(payload).eq("id", item.id)
      : await supabase.from("menu_items").insert(payload);
    setSaving(false);

    if (error) return setError(error.message);
    onSaved(item ? "Item updated" : "Item added");
    onClose();
  }

  const input = "w-full rounded-xl border border-rust/20 bg-transparent px-4 py-3 text-sm outline-none focus:border-ember";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          data-lenis-prevent
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-midnight/50 p-4 backdrop-blur-sm"
        >
          <motion.form
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="grid w-full max-w-3xl gap-6 rounded-3xl bg-cream p-6 text-rust shadow-2xl md:grid-cols-[1fr_240px] md:p-8"
          >
            {/* Fields */}
            <div className="space-y-4">
              <h3 className="font-serif text-3xl">{item ? "Edit item" : "New item"}</h3>
              <input required placeholder="Name" value={form.name} onChange={(e) => set("name", e.target.value)} className={input} />
              <textarea
                placeholder="Description"
                rows={2}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className={input}
              />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.category} onChange={(e) => set("category", e.target.value as Category)} className={input}>
                  <option value="coffee">Coffee</option>
                  <option value="non-coffee">Non-Coffee</option>
                  <option value="brunch">Brunch</option>
                  <option value="pastry">Pastry</option>
                </select>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Price (RM)"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  className={input}
                />
              </div>

              {/* Photo upload */}
              <div>
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    const f = e.dataTransfer.files[0];
                    if (f) upload(f);
                  }}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm transition-colors ${
                    dragging ? "border-ember bg-ember/5" : "border-rust/20 hover:border-ember"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) upload(f);
                      e.target.value = "";
                    }}
                  />
                  {uploading ? (
                    <span className="animate-pulse">Uploading…</span>
                  ) : (
                    <span>{form.image_url ? "Replace photo" : "Drop a photo here or click to upload"}</span>
                  )}
                  <span className="mt-1 text-xs text-rust/50">JPG, PNG or WebP · max {MAX_MB} MB</span>
                </label>
                {form.image_url && !uploading && (
                  <button
                    type="button"
                    onClick={() => set("image_url", "")}
                    className="mt-2 text-xs text-rust/60 hover:text-red-700"
                  >
                    Remove photo
                  </button>
                )}
              </div>

              <div className="flex gap-6 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.is_available} onChange={(e) => set("is_available", e.target.checked)} className="accent-rust" />
                  Available
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.is_signature} onChange={(e) => set("is_signature", e.target.checked)} className="accent-rust" />
                  Signature
                </label>
              </div>

              {error && <p className="text-sm text-red-700">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 rounded-full border border-rust/30 py-3 text-sm hover:border-ember">
                  Cancel
                </button>
                <button
                  disabled={saving || uploading}
                  className="flex-[2] rounded-full bg-rust py-3 text-sm uppercase tracking-[0.2em] text-cream hover:bg-ember disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>

            {/* Live preview */}
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-rust/60">Live preview</p>
              <div className="overflow-hidden rounded-3xl bg-white/70 ring-1 ring-rust/10">
                <div className="relative aspect-[4/3] bg-linear-to-br from-rust to-ember">
                  <AnimatePresence mode="wait">
                    {form.image_url ? (
                      <motion.img
                        key={form.image_url}
                        src={form.image_url}
                        alt=""
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <motion.span
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 grid place-items-center font-serif text-6xl text-cream/30"
                      >
                        {form.name[0] ?? "S"}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {form.is_signature && (
                    <span className="absolute left-3 top-3 rounded-full bg-cream/90 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em]">
                      Signature
                    </span>
                  )}
                  {!form.is_available && (
                    <div className="absolute inset-0 grid place-items-center bg-midnight/60 text-[10px] uppercase tracking-[0.3em] text-cream">
                      Sold out
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-serif text-lg">{form.name || "Item name"}</p>
                  <p className="text-xs text-rust/60">{form.description || "Description"}</p>
                  <p className="mt-2 text-sm font-semibold">RM {Number(form.price || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}