import type { CartLine, OrderType } from "./types";

// Mesti sama dengan rates dalam SQL function place_order
export const SERVICE_CHARGE_RATE = 0.1;
export const SST_RATE = 0.06;

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function calcTotals(cart: CartLine[], orderType: OrderType) {
  const subtotal = round2(cart.reduce((s, l) => s + Number(l.item.price) * l.quantity, 0));
  const serviceCharge = orderType === "dine_in" ? round2(subtotal * SERVICE_CHARGE_RATE) : 0;
  const sst = round2((subtotal + serviceCharge) * SST_RATE);
  const total = round2(subtotal + serviceCharge + sst);
  return { subtotal, serviceCharge, sst, total };
}