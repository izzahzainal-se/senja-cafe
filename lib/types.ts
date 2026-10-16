export type OrderType = "dine_in" | "takeaway";
export type Category = "coffee" | "non-coffee" | "brunch" | "pastry";

export interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
  opening_hours: string;
  phone: string | null;
  is_open: boolean;
  table_count: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  category: Category;
  price: number;
  image_url: string | null;
  is_signature: boolean;
  is_available: boolean;
}

export interface CartLine {
  item: MenuItem;
  quantity: number;
}