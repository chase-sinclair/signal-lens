export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#111827]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16">
        <p className="font-mono text-sm uppercase tracking-[0.18em] text-[#5f6b7a]">
          SignalLens AI
        </p>
        <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight text-[#0b1220] md:text-7xl">
          Company-aware SEC filing signals for sales teams.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4b5563]">
          Select a seller company, scan official 8-K filings, and generate a
          sales action brief only when the disclosure creates a real account
          action.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            "CrowdStrike vertical slice",
            "Official SEC EDGAR source",
            "Evidence-backed brief output",
          ].map((item) => (
            <div
              key={item}
              className="border border-[#d9dde5] bg-white p-5 text-sm font-medium text-[#1f2937]"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
