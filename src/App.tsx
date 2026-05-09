import React, { useState, useEffect } from "react";
import { Search, Building2, CheckCircle2, XCircle, Loader2, Info, ShieldCheck, Terminal, Copy, Clock, Database } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RncData {
  rnc: string;
  name: string;
  commercialName: string;
  status: string;
  type: string;
  activity: string;
  adminDate: string;
}

interface HistoryItem {
  rnc: string;
  name: string;
  timestamp: string;
}

export default function App() {
  const [rnc, setRnc] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ exists: boolean; data?: RncData; error?: string } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("rnc_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const validateRnc = async (e?: React.FormEvent, manualRnc?: string) => {
    if (e) e.preventDefault();
    const targetRnc = manualRnc || rnc;
    if (!targetRnc) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/validate-rnc/${targetRnc}`);
      const data = await response.json();
      setResult(data);

      if (data.exists && data.data) {
        const newItem = {
          rnc: data.data.rnc,
          name: data.data.name,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updatedHistory = [newItem, ...history.filter(h => h.rnc !== newItem.rnc)].slice(0, 10);
        setHistory(updatedHistory);
        localStorage.setItem("rnc_history", JSON.stringify(updatedHistory));
      }
    } catch (err) {
      setResult({ exists: false, error: "Error de conexión con el servidor." });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-[#fafafa] font-sans overflow-hidden">
      {/* Sidebar: History */}
      <aside className="w-72 border-r border-zinc-800 bg-[#0c0c0e] flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Recent Lookups</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {history.length === 0 ? (
            <div className="p-4 text-center">
              <Clock className="mx-auto text-zinc-700 mb-2" size={24} />
              <p className="text-[11px] text-zinc-600">No recent activity</p>
            </div>
          ) : (
            history.map((item, i) => (
              <button
                key={i}
                onClick={() => { setRnc(item.rnc); validateRnc(undefined, item.rnc); }}
                className={`w-full text-left p-3 rounded-lg border transition-all group ${
                  result?.data?.rnc === item.rnc 
                    ? "bg-blue-600/5 border-blue-500/30 shadow-lg shadow-blue-900/5" 
                    : "border-transparent hover:bg-zinc-800/50 hover:border-zinc-700"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-xs font-mono ${result?.data?.rnc === item.rnc ? "text-blue-400" : "text-zinc-300"}`}>
                    {item.rnc}
                  </span>
                  <span className="text-[9px] text-zinc-600">{item.timestamp}</span>
                </div>
                <div className="text-[11px] text-zinc-500 truncate font-medium group-hover:text-zinc-400">
                  {item.name}
                </div>
              </button>
            ))
          )}
        </div>
        <div className="p-4 border-t border-zinc-800 bg-[#09090b]/50">
          <div className="text-[10px] text-zinc-600 flex justify-between font-bold uppercase tracking-wider mb-2">
            <span>Server Latency</span>
            <span className="text-zinc-400">24ms</span>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-[15%] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Navigation */}
        <nav className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-[#09090b] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center font-bold italic tracking-tighter shadow-lg shadow-blue-900/40">
              DG
            </div>
            <div className="flex flex-col">
              <span className="font-semibold tracking-tight text-sm leading-none flex items-center gap-2">
                RNC Engine <span className="text-zinc-500 font-normal text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded">v2.4.0</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-green-500/5 text-green-400 px-3 py-1.5 rounded-full border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Systems Operational</span>
            </div>
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#09090b] via-[#09090b] to-[#111114] p-8 lg:p-12">
          <div className="max-w-5xl mx-auto space-y-12">
            {/* Header Section */}
            <div className="max-w-2xl">
              <h1 className="text-4xl font-light mb-4 tracking-tight">
                RNC Lookup <span className="italic font-serif text-zinc-500">Engine</span>
              </h1>
              <p className="text-zinc-400 text-sm leading-relaxed font-light">
                Verify Dominican taxpayers instantly. Enter a valid RNC (9 digits) or Personal ID (11 digits) 
                to retrieve official records from the DGII database.
              </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={(e) => validateRnc(e)} className="relative group max-w-2xl">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-blue-500 transition-colors">
                <Search size={20} />
              </div>
              <input
                type="text"
                value={rnc}
                onChange={(e) => setRnc(e.target.value)}
                placeholder="000-00000-0"
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-5 pl-14 pr-32 text-xl font-mono text-white transition-all focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 hover:border-zinc-700 shadow-2xl"
                maxLength={11}
              />
              <button
                type="submit"
                disabled={loading || !rnc}
                className="absolute right-3 top-3 bottom-3 px-6 bg-blue-600 text-white rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-900/50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : "Validate"}
              </button>
            </form>

            {/* Results Display */}
            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -10 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                >
                  {result.exists && result.data ? (
                    <>
                      {/* Detailed View */}
                      <div className="lg:col-span-7 bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-8 shadow-sm flex flex-col relative overflow-hidden">
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl" />
                        
                        <div className="flex justify-between items-start mb-8 relative z-10">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Official Identity Data</span>
                          <span className="bg-green-500/10 text-green-400 text-[10px] font-bold px-3 py-1.5 rounded border border-green-500/20 tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            {result.data.status}
                          </span>
                        </div>

                        <div className="space-y-8 relative z-10">
                          <div>
                            <label className="text-[10px] uppercase text-zinc-600 font-bold block mb-1.5 tracking-widest">Razón Social</label>
                            <div className="text-2xl font-semibold tracking-tight text-white leading-tight">
                              {result.data.name}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-8">
                            <div>
                              <label className="text-[10px] uppercase text-zinc-600 font-bold block mb-1.5 tracking-widest">RNC Identifier</label>
                              <div className="text-lg font-mono text-blue-400">{result.data.rnc}</div>
                            </div>
                            <div>
                              <label className="text-[10px] uppercase text-zinc-600 font-bold block mb-1.5 tracking-widest">Registry Date</label>
                              <div className="text-lg font-medium text-zinc-300">{result.data.adminDate}</div>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] uppercase text-zinc-600 font-bold block mb-1.5 tracking-widest">Economic Activity</label>
                            <div className="text-sm text-zinc-400 leading-relaxed max-w-lg italic">
                              {result.data.activity}
                            </div>
                          </div>

                          <div className="pt-6 border-t border-zinc-800 flex items-center justify-between">
                            <div>
                              <label className="text-[10px] uppercase text-zinc-600 font-bold block mb-1 tracking-widest">Type</label>
                              <div className="text-xs text-zinc-500 font-medium">{result.data.type}</div>
                            </div>
                            <div className="text-right">
                              <label className="text-[10px] uppercase text-zinc-600 font-bold block mb-1 tracking-widest">Commercial Name</label>
                              <div className="text-xs text-zinc-500 font-medium">{result.data.commercialName || "None Registered"}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Side Panel: JSON & Info */}
                      <div className="lg:col-span-5 flex flex-col gap-6">
                        {/* JSON View */}
                        <div className="bg-black/40 border border-zinc-800 rounded-2xl p-6 font-mono text-[11px] relative group overflow-hidden">
                          <div className="flex justify-between items-center mb-4 text-zinc-500 relative z-10">
                            <span className="flex items-center gap-2"><Terminal size={14}/> RAW JSON RESPONSE</span>
                            <button 
                              onClick={() => copyToClipboard(JSON.stringify(result.data, null, 2))}
                              className="hover:text-white transition-colors flex items-center gap-1 bg-white/5 px-2 py-1 rounded"
                            >
                              <Copy size={12}/> Copy
                            </button>
                          </div>
                          <div className="text-blue-300 relative z-10 max-h-[300px] overflow-y-auto scrollbar-hide leading-relaxed">
                            <pre>{JSON.stringify(result.data, null, 2)}</pre>
                          </div>
                          <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none select-none">
                            <Database size={100} />
                          </div>
                        </div>

                        {/* Tip Card */}
                        <div className="bg-blue-600 rounded-2xl p-6 shadow-2xl shadow-blue-900/30">
                          <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2 uppercase tracking-wide">
                            <ShieldCheck size={16}/> Integration Safe
                          </h4>
                          <p className="text-blue-100 text-[12px] leading-relaxed font-medium">
                            Official DGII records confirmed. Use the identifier above to update your CRM or invoicing system.
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-full bg-red-950/20 border border-red-900/30 rounded-2xl p-10 flex items-center gap-8">
                      <div className="bg-red-600 p-5 rounded-2xl text-white shadow-2xl shadow-red-600/30 shrink-0">
                        <XCircle size={40} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-red-400 mb-2 uppercase tracking-tighter">Lookup Failed</h3>
                        <p className="text-red-300 text-lg font-light leading-relaxed max-w-2xl">
                          {result.error || "The requested RNC could not be found in the current taxpayer registry. Please verify the 9 or 11 digits and try again."}
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty State Features */}
            {!result && !loading && (
              <div className="grid md:grid-cols-3 gap-8">
                <FeatureBox 
                  icon={<ShieldCheck className="text-blue-500" />}
                  title="Official Data"
                  desc="Direct streaming from DGII ensures 100% accurate entity status."
                />
                <FeatureBox 
                  icon={<Terminal className="text-blue-500" />}
                  title="JSON Output"
                  desc="Clean, actionable data structures ready for API integration."
                />
                <FeatureBox 
                  icon={<Database className="text-blue-500" />}
                  title="Zero Cache"
                  desc="Real-time lookups bypass stale data for current tax situation."
                />
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="h-12 border-t border-zinc-800 bg-[#09090b] flex items-center justify-between px-8 text-[10px] text-zinc-600 shrink-0">
          <div className="flex gap-6 font-medium">
            <span className="uppercase tracking-widest">© 2024 RNC ENGINE CONNECT</span>
            <span className="hover:text-zinc-400 cursor-pointer transition-colors">SECURITY AUDIT</span>
            <span className="hover:text-zinc-400 cursor-pointer transition-colors">DGII TERMS</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-blue-500 rounded-full" /> API PERFORMANCE: 0.12s</span>
            <span className="text-zinc-500">PROD-ENV-RD-01</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FeatureBox({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-6 rounded-2xl border border-zinc-800/50 bg-[#0c0c0e]/50 hover:border-zinc-700 transition-colors">
      <div className="mb-4">{icon}</div>
      <h4 className="text-white font-bold mb-2 tracking-tight text-sm uppercase">{title}</h4>
      <p className="text-xs text-zinc-500 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}

