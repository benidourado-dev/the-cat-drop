const ITEMS = ["ACHADINHO DO GATO", "ATÉ 70% OFF", "VERIFICADO NA SHOPEE", "FRETE GRÁTIS SELECIONADO", "NOVO DROP HOJE"];

export const Marquee = () => {
  const row = [...ITEMS, ...ITEMS, ...ITEMS];
  return (
    <div data-testid="marquee-ribbon" className="overflow-hidden border-y border-[#FFB800]/20 bg-[#FFB800]/5 py-3">
      <div className="animate-marquee flex w-max items-center">
        {[...row, ...row].map((t, i) => (
          <span key={i} className="flex items-center text-xs sm:text-sm font-jetbrains uppercase tracking-[0.25em] text-[#FFB800] whitespace-nowrap">
            <span className="px-6">{t}</span>
            <span className="text-[#FF6B00]">•</span>
          </span>
        ))}
      </div>
    </div>
  );
};
