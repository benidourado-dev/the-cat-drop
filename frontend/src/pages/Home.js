import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { Marquee } from "../components/Marquee";
import { FeaturedDrops } from "../components/FeaturedDrops";
import { Catalog } from "../components/Catalog";
import { PaymentSection } from "../components/PaymentSection";
import { SupportSection } from "../components/SupportSection";
import { MascotSection } from "../components/MascotSection";
import { Footer } from "../components/Footer";
import { api } from "../lib/api";
import { FALLBACK_PRODUCTS } from "../data/productsFallback";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/products")
      .then((res) => setProducts(res.data))
      .catch(() => setProducts(FALLBACK_PRODUCTS))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#0B0C10] text-[#F4F4F6] min-h-screen">
      <Header />
      <main>
        <Hero />
        <Marquee />
        {loading ? (
          <div data-testid="products-loading" className="max-w-7xl mx-auto px-4 py-24 text-center text-zinc-500 text-sm">
            O Gato está trazendo os achadinhos...
          </div>
        ) : (
          <>
            <FeaturedDrops products={products} />
            <Catalog products={products} />
          </>
        )}
        <PaymentSection />
        <SupportSection />
        <MascotSection />
      </main>
      <Footer />
    </div>
  );
}
