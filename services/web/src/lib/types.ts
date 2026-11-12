export type Product = {
  id: number;
  name: string;
  description: string;
  image_url: string | null;
  price: number;
  stock: number;
};

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type CreatedOrder = {
  id: number;
  status: OrderStatus;
};

export type Order = CreatedOrder & {
  product_id: number;
  quantity: number;
  created_at: string;
  completed_at: string | null;
};
