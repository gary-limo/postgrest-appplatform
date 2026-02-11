export function Footer() {
  return (
    <footer className="bg-[#1B2A4A] text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 items-center justify-center rounded bg-[#C4A35A] px-2 text-[#1B2A4A] font-extrabold text-xs">
              H1B
            </div>
            <span className="text-sm text-white/80">
              H1B Wages Explorer
            </span>
          </div>
          <p className="text-xs text-white/50 text-center sm:text-right">
            Data sourced from U.S. Department of Labor LCA Disclosure Data (2025).
            For informational purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
}
