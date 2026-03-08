import React, { useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function FormulaEditor({ onGateCreated }) {
  const [formula, setFormula] = useState('\\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}');
  const [name, setName] = useState('U_custom');
  const [status, setStatus] = useState('idle'); // idle, checking, success, error
  const [message, setMessage] = useState('');

  const handleValidate = async () => {
    setStatus('checking');
    try {
      // In reality this calls our FastAPI backend: POST /api/transpile
      const response = await fetch('http://localhost:8000/api/transpile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex_formula: formula })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setStatus('success');
        setMessage('Formula is a valid Unitary Matrix!');
        if (onGateCreated) {
          onGateCreated({ name, latex_formula: formula, is_custom: true });
        }
      } else {
        setStatus('error');
        setMessage(data.message || 'Validation failed.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Cannot connect to Quantum Engine API.');
    }
  };

  return (
    <div className="w-full p-4 glass-panel rounded-xl flex flex-col gap-4">
      <h2 className="text-xl font-bold text-gray-200">Custom Gate Formula</h2>
      
      <div className="flex gap-4">
         <input 
           type="text" 
           value={name}
           onChange={(e) => setName(e.target.value)}
           placeholder="Gate Name"
           className="w-1/3 bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-primary-500"
         />
      </div>

      <textarea 
        value={formula}
        onChange={(e) => {
           setFormula(e.target.value);
           setStatus('idle');
           setMessage('');
        }}
        placeholder="Enter LaTeX Matrix..."
        className="w-full h-32 bg-black/40 border border-white/10 rounded-lg p-4 text-mono text-pink-300 focus:outline-none focus:border-primary-500 resize-none font-mono text-sm leading-relaxed"
      />
      
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2 text-sm">
            {status === 'checking' && <span className="text-gray-400 flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> Validating math...</span>}
            {status === 'success' && <span className="text-green-400 flex items-center gap-1"><CheckCircle2 size={16}/> {message}</span>}
            {status === 'error' && <span className="text-red-400 flex items-center gap-1"><XCircle size={16}/> {message}</span>}
         </div>
         
         <button 
           onClick={handleValidate}
           disabled={status === 'checking'}
           className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold border border-white/5"
         >
           Validate & Save
         </button>
      </div>
    </div>
  );
}
