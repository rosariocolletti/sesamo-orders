export interface Client {
  id: string;
  name: string;
  address: string;
  vat: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: string;
}

export interface Item {
  id: string;
  name: string;
  category: string;
  price: number;
  weight: number;
  picture_url: string;
  description: string;
  createdAt: string;
}

export interface OrderItem {
  itemId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  clientId: string;
  items: OrderItem[];
  deliveryDate: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  notes: string;
  total: number;
  createdAt: string;
  selected?: boolean;
}

export type TabType = 'clients' | 'items' | 'orders' | 'merge' | 'reports';

export interface ReportData {
  period: string;
  value: number;
  count: number;
}

export interface ProductReport {
  itemId: string;
  itemName: string;
  category: string;
  totalRevenue: number;
  totalQuantity: number;
  orderCount: number;
  data: ReportData[];
}

export interface ClientReport {
  clientId: string;
  clientName: string;
  totalRevenue: number;
  orderCount: string;
  data: ReportData[];
}