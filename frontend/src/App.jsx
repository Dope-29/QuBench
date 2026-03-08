import React, { useEffect, useState } from 'react';
import { useSimulationStore } from './services/api';
import { Activity, Beaker, Hexagon, Settings, Cpu } from 'lucide-react';

import BlochSphere from './components/BlochSphere';
import FormulaEditor from './components/FormulaEditor';
import CircuitDesigner from './components/CircuitDesigner';
import AnalyticsDashboard from './components/AnalyticsDashboard';

function App() {
  const { connect, disconnect, isConnected, simulationResult, error } = useSimulationStore();
  const [hardwareProfile, setHardwareProfile] = useState('ideal');
  const [customGates, setCustomGates] = useState([]);
  const [circuitInstructions, setCircuitInstructions] = useState([]);

  // Connect to WebSocket on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const handleGateCreated = (gate) => {
    setCustomGates(prev => [...prev, gate]);
  };

  return (
    <div className="min-h-screen bg-[#0f1015] text-gray-200 font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/20 backdrop-blur-md">
         <div className="flex items-center gap-3">
            <Hexagon className="text-primary-500" size={28} />
            <h1 className="text-2xl font-bold tracking-tight">QuBench <span className="text-sm font-normal text-gray-500 ml-2">Discovery Platform</span></h1>
         </div>
         <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 text-sm px-3 py-1 rounded-full border ${isConnected ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
               <Activity size={14} />
               {isConnected ? 'Engine Online' : 'Disconnected'}
            </div>
            
            {/* Hardware Profile Selector */}
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5">
               <Cpu size={16} className="text-gray-400" />
               <select 
                 className="bg-transparent text-sm focus:outline-none cursor-pointer"
                 value={hardwareProfile}
                 onChange={(e) => setHardwareProfile(e.target.value)}
               >
                 <option value="ideal">Ideal Profile</option>
                 <option value="superconducting">Superconducting (Noisy)</option>
                 <option value="trapped_ion">Trapped Ion (Noisy)</option>
               </select>
            </div>
         </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-64px)] overflow-hidden">
        
        {/* Left Column (Editors) */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
           <FormulaEditor onGateCreated={handleGateCreated} />
           
           <div className="glass-panel rounded-xl p-4 flex-1">
             <h2 className="text-lg font-bold text-gray-300 mb-4 flex items-center gap-2">
                <Beaker size={18} /> Available Custom Gates
             </h2>
             {customGates.length === 0 ? (
               <div className="text-sm text-gray-500 text-center mt-10">No custom gates defined yet. Create one above.</div>
             ) : (
                <div className="grid grid-cols-2 gap-2">
                  {customGates.map((gate, i) => (
                    <div key={i} className="bg-purple-900/40 border border-purple-500/30 rounded p-2 text-center text-sm font-mono text-purple-200 truncate">
                      {gate.name}
                    </div>
                  ))}
                </div>
             )}
           </div>
        </div>
        
        {/* Right Column (Visualizations) */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-full">
           
           {/* Top: 3D Render & Analytics */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-1/2">
              <div className="glass-panel rounded-xl flex items-center justify-center overflow-hidden border border-white/10">
                 <BlochSphere 
                   vector={simulationResult?.bloch_vectors?.[0] || {x: 0, y: 0, z: 1}} 
                   title="Qubit 0 State Vector"
                 />
              </div>
              
              <div className="h-full">
                 <AnalyticsDashboard 
                   metrics={simulationResult?.metrics}
                   qmsScore={simulationResult?.qms_score}
                 />
              </div>
           </div>
           
           {/* Bottom: Circuit Designer */}
           <div className="h-1/2 min-h-[300px]">
              <CircuitDesigner 
                 instructions={circuitInstructions} 
                 setInstructions={setCircuitInstructions} 
                 customGates={customGates}
              />
           </div>
           
           {error && (
             <div className="absolute bottom-6 right-6 bg-red-900/80 border border-red-500 text-red-200 px-4 py-3 rounded shadow-lg">
               {error}
             </div>
           )}
           
        </div>
        
      </main>
    </div>
  );
}

export default App;
