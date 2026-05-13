import { useState, type FormEvent } from 'react';

function SymptomRecordPage() {
  const [symptom, setSymptom] = useState('');
  const [records, setRecords] = useState<Array<{ id: number; description: string; date: string }>>([]);

  const addRecord = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!symptom.trim()) {
      return;
    }

    setRecords((current) => [
      { id: Date.now(), description: symptom.trim(), date: new Date().toLocaleString() },
      ...current
    ]);
    setSymptom('');
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl shadow-slate-950/30">
        <h2 className="text-3xl font-semibold text-white">Symptom Record</h2>
        <p className="mt-3 text-slate-400">Log asthma symptoms, triggers, and notes so your doctor can review the history.</p>
      </section>

      <form onSubmit={addRecord} className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
        <label className="block text-sm font-semibold text-slate-300">What symptoms are you experiencing?</label>
        <textarea
          value={symptom}
          onChange={(event) => setSymptom(event.target.value)}
          className="mt-4 h-40 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 shadow-inner focus:border-cyan-500 focus:outline-none"
          placeholder="Coughing, wheezing, chest tightness, or trigger notes..."
        />
        <button
          className="mt-4 inline-flex items-center justify-center rounded-full bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
          type="submit"
        >
          Save Record
        </button>
      </form>

      <section className="space-y-4">
        <h3 className="text-2xl font-semibold text-white">Recent Records</h3>
        {records.length ? (
          <div className="space-y-4">
            {records.map((item) => (
              <div key={item.id} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                <p className="text-sm text-slate-500">{item.date}</p>
                <p className="mt-2 text-slate-200">{item.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-400">No symptom records yet. Add one to start tracking your condition.</p>
        )}
      </section>
    </div>
  );
}

export default SymptomRecordPage;
