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
  merchandise: {
    id: string;
    title: string;
    product: CartLineMerchandiseProduct | null;
  };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: {
    nodes: CartLine[];
  };
};

export type CurrentCartResponse = {
  cart: Cart | null;
};
