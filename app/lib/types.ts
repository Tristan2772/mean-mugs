export type ProductImages = {
  id?: string | null;
  url?: string | null;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  handle: string;
  availableForSale: boolean;
  priceRange: {
    minVariantPrice: {
      amount: string;
    };
  };
  compareAtPriceRange?: {
    maxVariantPrice: {
      amount: string;
    };
  };
  images: {
    nodes: ProductImages[];
  };
};

export type CartLineMerchandiseProduct = Pick<Product, "id" | "title" | "handle" | "images">;

export type CartLine = {
  id: string;
  quantity: number;
  cost?: {
    totalAmount?: {
      amount: string;
      currencyCode: string;
    } | null;
  } | null;
  merchandise: {
    id: string;
    title: string;
    selectedOptions?: Array<{
      name: string;
      value: string;
    }>;
    product: CartLineMerchandiseProduct | null;
  };
};

export type Cart = {
  totalQuantity: number;
  cost?: {
    totalAmount?: {
      amount: string;
      currencyCode: string;
    } | null;
  } | null;
  lines: {
    nodes: CartLine[];
  };
};

export type CurrentCartResponse = {
  cart: Cart | null;
};
