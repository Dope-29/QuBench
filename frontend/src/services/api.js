import { create } from 'zustand';

// Simple global state for the simulation data
export const useSimulationStore = create((set, get) => ({
  socket: null,
  isConnected: false,
  simulationResult: null,
  error: null,
  
  connect: (url = 'ws://127.0.0.1:8000/ws/simulate') => {
    // Prevent multiple connections
    if (get().socket) return;
    
    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      // Ensure we haven't already disconnected this socket
      if (get().socket === ws) {
        set({ isConnected: true, error: null });
        console.log('QuBench Engine Connected');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error: ', error);
    };
    
    ws.onmessage = (event) => {
      if (get().socket !== ws) return;
      const data = JSON.parse(event.data);
      if (data.type === 'simulation_result') {
        set({ simulationResult: data });
      } else if (data.type === 'error') {
        set({ error: data.message });
      }
    };
    
    ws.onclose = () => {
      if (get().socket === ws) {
        set({ isConnected: false, socket: null });
      }
    };
    
    set({ socket: ws });
  },
  
  disconnect: () => {
    set((state) => {
      if (state.socket) {
        state.socket.close();
      }
      return { socket: null, isConnected: false };
    });
  },

  sendSimulationRequest: (requestPayload) => {
    set((state) => {
      if (state.socket && state.isConnected) {
        state.socket.send(JSON.stringify(requestPayload));
        // Optimistic clear of old error
        return { error: null };
      }
      return { error: 'Not connected to QuBench Engine' };
    });
  }
}));
