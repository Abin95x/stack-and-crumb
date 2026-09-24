"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";

export type CartLine = {
  /** Same id = same line; adding again bumps the quantity. */
  id: string;
  name: string;
  price: number;
  qty: number;
  /** e.g. the layers of a custom burger. */
  note?: string;
  image?: string;
};

type Cart = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (line: Omit<CartLine, "qty">) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  /** Last thing added, for the toast; changes identity on every add. */
  lastAdded: { name: string; at: number } | null;
};

const CartContext = createContext<Cart | null>(null);
const STORAGE_KEY = "stack-and-crumb:bag";

/* A tiny localStorage-backed store read through useSyncExternalStore: the server
   and the hydration pass see an empty bag, then React swaps in the saved one. */
const EMPTY: CartLine[] = [];
let saved: CartLine[] | null = null;
const listeners = new Set<() => void>();

function read(): CartLine[] {
  if (saved === null) {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      // Menu photos moved from .png to .webp; fix up bags saved before that.
      saved = Array.isArray(parsed)
        ? parsed.map((l: CartLine) => ({ ...l, image: l.image?.replace(/^(\/menu\/.+)\.png$/, "$1.webp") }))
        : [];
    } catch {
      saved = [];
    }
  }
  return saved;
}

function write(next: CartLine[]) {
  saved = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: the bag still works for this visit */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    saved = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const lines = useSyncExternalStore(subscribe, read, () => EMPTY);
  const [open, setOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<Cart["lastAdded"]>(null);

  const add = useCallback((line: Omit<CartLine, "qty">) => {
    const cur = read();
    const found = cur.find((l) => l.id === line.id);
    write(found ? cur.map((l) => (l.id === line.id ? { ...l, qty: l.qty + 1 } : l)) : [...cur, { ...line, qty: 1 }]);
    setLastAdded({ name: line.name, at: Date.now() });
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    const cur = read();
    write(qty <= 0 ? cur.filter((l) => l.id !== id) : cur.map((l) => (l.id === id ? { ...l, qty } : l)));
  }, []);

  const clear = useCallback(() => write([]), []);

  const value = useMemo<Cart>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal: lines.reduce((n, l) => n + l.qty * l.price, 0),
      open,
      setOpen,
      add,
      setQty,
      clear,
      lastAdded,
    }),
    [lines, open, add, setQty, clear, lastAdded],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used inside <CartProvider>");
  return cart;
}
