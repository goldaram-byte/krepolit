import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/site";

const availabilityByStockStatus: Record<string, string> = {
  in_stock: "https://schema.org/InStock",
  on_order: "https://schema.org/BackOrder",
  out_of_stock: "https://schema.org/OutOfStock",
};

export type ProductJsonLdInput = {
  slug: string;
  name: string;
  decorName: string;
  images: string[];
  sku: string;
  brandName: string;
  price: number;
  stockStatus: string;
};

export function ProductJsonLd({ product }: { product: ProductJsonLdInput }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.decorName,
        sku: product.sku,
        image: product.images.map((src) => `${SITE_URL}${src}`),
        brand: {
          "@type": "Brand",
          name: product.brandName,
        },
        offers: {
          "@type": "Offer",
          url: `${SITE_URL}/product/${product.slug}`,
          priceCurrency: "RUB",
          price: product.price,
          availability: availabilityByStockStatus[product.stockStatus] ?? "https://schema.org/OutOfStock",
        },
      }}
    />
  );
}
