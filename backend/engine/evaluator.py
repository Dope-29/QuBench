from qiskit import QuantumCircuit, transpile
from qiskit.quantum_info import Statevector, DensityMatrix
from qiskit_aer import AerSimulator
from typing import Dict, Any, List
import numpy as np

class CircuitEvaluator:
    def __init__(self, num_qubits: int):
        self.num_qubits = num_qubits
        self.instruction_log = []
        # Store initial pure ground state |0...0>
        self.qc = QuantumCircuit(self.num_qubits)

    def append_gate(self, gate_name: str, qubits: List[int], matrix: np.ndarray = None):
        """
        Appends a standard or custom gate.
        """
        if matrix is not None:
             # Custom unitary gate
            self.qc.unitary(matrix, qubits, label=gate_name)
        else:
            # Standard gate routing
            getattr(self.qc, gate_name)(*qubits)
            
        self.instruction_log.append({"gate": gate_name, "qubits": qubits})

    def get_circuit_metrics(self) -> Dict[str, Any]:
        """ Measures basic circuit overhead parameters. """
        return {
            "depth": self.qc.depth(),
            "gate_count": sum(self.qc.count_ops().values()),
            "ops": dict(self.qc.count_ops())
        }

    def simulate_state(self, noise_model=None, seed: int = None) -> Dict[str, Any]:
        """
        Simulates the circuit with the given noise model. Returns DensityMatrix data 
        and calculates Bloch coordinates for visual rendering.
        """
        simulator = AerSimulator()
        
        # Bind noise model if active
        if noise_model and not noise_model.is_ideal():
            simulator.set_options(noise_model=noise_model)
            
        if seed is not None:
            simulator.set_options(seed_simulator=seed)

        # Transpile for the simulator
        # Saving statevector/density matrix 
        circ = self.qc.copy()
        if noise_model and not noise_model.is_ideal():
            circ.save_density_matrix()
        else:
            circ.save_statevector()
            
        compiled_circ = transpile(circ, simulator)
        result = simulator.run(compiled_circ).result()
        
        out_state = None
        if noise_model and not noise_model.is_ideal():
            out_state = result.data(0)['density_matrix']
            is_pure = False
        else:
            out_state = result.data(0)['statevector']
            is_pure = True
            
        return {
            "state_data": out_state,
            "is_pure": is_pure,
            "metrics": self.get_circuit_metrics(),
            "bloch_vectors": self._calculate_bloch_vectors(out_state)
        }
        
    def _calculate_bloch_vectors(self, state) -> List[Dict[str, float]]:
        """
        Calculates [x,y,z] Bloch sphere coordinates for each isolated qubit.
        Warning: Only fully accurate for separable states / marginal traces.
        """
        vectors = []
        if isinstance(state, Statevector):
            dm = DensityMatrix(state)
        else:
            dm = state
            
        # Pauli matrices
        I = np.array([[1, 0], [0, 1]])
        X = np.array([[0, 1], [1, 0]])
        Y = np.array([[0, -1j], [1j, 0]])
        Z = np.array([[1, 0], [0, -1]])
            
        for q in range(self.num_qubits):
            # Trace out other qubits to get reduced density matrix for qubit 'q'
            # Partial trace logic here is simplified. Since qiskit `partial_trace` exists:
            from qiskit.quantum_info import partial_trace
            traced_qubits = list(range(self.num_qubits))
            traced_qubits.remove(q)
            
            if traced_qubits:
                rdm = partial_trace(dm, traced_qubits).data
            else:
                rdm = dm.data
                
            x = np.trace(np.dot(X, rdm)).real
            y = np.trace(np.dot(Y, rdm)).real
            z = np.trace(np.dot(Z, rdm)).real
            
            vectors.append({"x": x, "y": y, "z": z, "qubit_id": q})
            
        return vectors

    def calculate_qms(self, state_result: Dict[str, Any]) -> float:
        """
        Calculates Quantum Merit Score based on depth, gates, and purity/fidelity.
        A crude heuristic matching SDD reqs: Lower depth/count + higher purity = Higher score.
        """
        metrics = state_result["metrics"]
        
        # Max score is 100. Penalize depth and count.
        # Assuming QMS = (Fidelity_Proxy * 100) - (Depth * 0.5) - (GateCount * 0.2)
        
        purity = 1.0 # 1.0 if pure
        state = state_result["state_data"]
        
        if isinstance(state, DensityMatrix):
            purity = state.purity().real
            
        score = (purity * 100) - (metrics["depth"] * 0.5) - (metrics["gate_count"] * 0.2)
        return max(0.0, score)
