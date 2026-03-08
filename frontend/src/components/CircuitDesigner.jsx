import React from 'react';
import { useSimulationStore } from '../services/api';
import { Play } from 'lucide-react';
import { DndContext, useDraggable, useDroppable, closestCenter, DragOverlay } from '@dnd-kit/core';

// Draggable Gate in the Palette
function DraggableGate({ id, children, type }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: id,
    data: { type: type, name: children }
  });

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes}
      className={`w-10 h-10 flex-shrink-0 border rounded flex items-center justify-center text-sm font-bold cursor-grab active:cursor-grabbing transition-colors
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        ${type === 'custom' 
          ? 'bg-purple-900/50 border-purple-500/50 hover:bg-purple-600 text-purple-100' 
          : 'bg-blue-900/50 border-blue-500/50 hover:bg-blue-600 text-blue-100'}`}
    >
      {children}
    </div>
  );
}

// Droppable Qubit Wire
function DroppableWire({ id, instructions, onRemoveGate }) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex items-center w-full h-16 relative transition-colors ${isOver ? 'bg-white/5 rounded-lg' : ''}`}
    >
      <div className="w-8 font-mono text-purple-400 mr-4 font-bold flex-shrink-0">q[{id}]</div>
      <div className="h-[2px] bg-white/20 w-full relative z-0"></div>
      
      {/* Render active gates on wire */}
      <div className="absolute left-[60px] flex gap-4 z-10 w-full overflow-x-auto items-center pr-4">
        {instructions.length === 0 ? (
            <div className={`w-12 h-12 rounded flex border border-dashed items-center justify-center text-xs transition-colors
              ${isOver ? 'bg-primary-500/20 border-primary-400 text-primary-200' : 'bg-white/5 border-white/20 text-gray-500'}`}>
              Drop Gate Here
            </div>
        ) : instructions.map((gate, i) => (
          <div 
            key={i} 
            onClick={() => onRemoveGate(i)}
            title="Click to remove"
            className={`w-12 h-12 flex items-center justify-center rounded-sm font-bold shadow-lg flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-red-500 hover:opacity-80 transition-all
              ${gate.is_custom ? 'bg-gradient-to-br from-purple-500 to-pink-600' : 'bg-blue-600 border border-blue-400'}`}
          >
            {gate.name.toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CircuitDesigner({ instructions = [], setInstructions, customGates = [] }) {
  const { sendSimulationRequest, isConnected } = useSimulationStore();
  
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    // If dropped over the wire
    if (over && over.id === 'wire-0') {
       const isCustom = active.data.current.type === 'custom';
       const gateName = active.data.current.name;

       let latexFormula = null;
       // If it's a custom gate, fetch the formula so backend can transpile it on the fly
       if (isCustom) {
           const found = customGates.find(g => g.name === gateName);
           if (found) latexFormula = found.latex_formula;
       }

       setInstructions([
         ...instructions, 
         { 
           name: gateName.toLowerCase(), 
           qubits: [0], 
           is_custom: isCustom,
           latex_formula: latexFormula
         }
       ]);
    }
  };

  const handleRemoveGate = (indexToRemove) => {
    setInstructions(instructions.filter((_, idx) => idx !== indexToRemove));
  };

  const handleRunSimulation = () => {
    if (!isConnected) return;
    if (instructions.length === 0) return; // Don't run empty circuit
    
    // We send the current instructions state to the backend
    sendSimulationRequest({
      num_qubits: 1, // Single qubit demo
      instructions: instructions,
      hardware_profile: "ideal"
    });
  };

  const clearCircuit = () => {
    setInstructions([]);
  };

  return (
    <div className="w-full h-full p-4 glass-panel rounded-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
         <h2 className="text-xl font-bold text-gray-200">Circuit Designer</h2>
         <div className="flex gap-2">
           <button 
             onClick={clearCircuit}
             className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors border border-white/10"
           >
             Clear
           </button>
           <button 
             onClick={handleRunSimulation}
             disabled={!isConnected || instructions.length === 0}
             className={`flex items-center gap-2 px-6 py-1.5 rounded-lg font-medium transition-all ${
               (isConnected && instructions.length > 0)
                 ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.5)]' 
                 : 'bg-gray-700 text-gray-500 cursor-not-allowed'
             }`}
           >
             <Play size={16} fill="currentColor" />
             Run Circuit
           </button>
         </div>
      </div>
      
      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        <div className="flex-1 bg-black/40 rounded-lg border border-white/5 overflow-hidden flex flex-col justify-center px-8 relative">
          {/* We only have 1 wire for the visual demo based on SDD currently */}
          <DroppableWire id="wire-0" instructions={instructions} onRemoveGate={handleRemoveGate} />
        </div>
        
        {/* Available Gates Palette */}
        <div className="flex flex-col gap-2 p-3 bg-black/20 rounded-lg border border-white/5">
           <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Standard Gates</span>
           <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
             {['H', 'X', 'Y', 'Z', 'S', 'T'].map(gate => (
               <DraggableGate key={`std-${gate}`} id={`std-gate-${gate}`} type="standard">
                  {gate}
               </DraggableGate>
             ))}
           </div>
           
           {customGates.length > 0 && (
             <>
               <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-2">Custom Formulas</span>
               <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                 {customGates.map((gate, i) => (
                   <DraggableGate key={`custom-${i}`} id={`custom-gate-${i}`} type="custom">
                      {gate.name}
                   </DraggableGate>
                 ))}
               </div>
             </>
           )}
        </div>
      </DndContext>
    </div>
  );
}
