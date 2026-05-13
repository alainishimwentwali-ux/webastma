function AnalyticsPage() {
  const metrics = [
    { label: 'Weekly risk alerts', value: '4 alerts' },
    { label: 'Symptom reports', value: '12 reports' },
    { label: 'Doctor consultations', value: '3 sessions' },
    { label: 'Environment warnings', value: '2 warnings' }
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl shadow-slate-950/30">
        <h2 className="text-3xl font-semibold text-white">Analytics</h2>
        <p className="mt-3 text-slate-400">Review how your symptoms, weather triggers, and consultation activity are trending over time.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{metric.label}</p>
            <p className="mt-4 text-4xl font-semibold text-white">{metric.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <h3 className="text-2xl font-semibold text-white">Trend Summary</h3>
        <p className="mt-3 text-slate-400">Most asthma-related activity has been linked to humidity and pollen spikes. Keep using the symptom tracker and consult your doctor when risk levels rise.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Worst trigger</p>
            <p className="mt-3 text-xl font-semibold text-white">Cold, damp air</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Best action</p>
            <p className="mt-3 text-xl font-semibold text-white">Schedule a video check-in</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AnalyticsPage;
