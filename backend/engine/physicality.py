from qiskit_aer.noise import NoiseModel, thermal_relaxation_error
from pydantic import BaseModel

class HardwareProfile(BaseModel):
    name: str
    t1: float  # Thermal relaxation time in nanoseconds
    t2: float  # Dephasing time in nanoseconds
    gate_time_1q: float # Time for 1-qubit gate in ns
    gate_time_2q: float # Time for 2-qubit gate in ns

# Predefined profiles
PROFILES = {
    "ideal": HardwareProfile(name="ideal", t1=float('inf'), t2=float('inf'), gate_time_1q=0, gate_time_2q=0),
    "superconducting": HardwareProfile(name="superconducting", t1=50e3, t2=70e3, gate_time_1q=50, gate_time_2q=300),
    "trapped_ion": HardwareProfile(name="trapped_ion", t1=1e9, t2=1e9, gate_time_1q=10e3, gate_time_2q=100e3)
}

class PhysicalityEngine:
    def __init__(self, seed: int = None):
        """
        Initializes the noise engine, maintaining a deterministic PRNG seed if provided.
        """
        self.seed = seed
        self.current_profile = PROFILES["ideal"]

    def set_profile(self, profile_name: str, custom_params: dict = None):
        if profile_name in PROFILES:
            self.current_profile = PROFILES[profile_name]
        elif profile_name == "custom" and custom_params:
            self.current_profile = HardwareProfile(**custom_params)
        else:
            raise ValueError(f"Unknown hardware profile: {profile_name}")

    def generate_noise_model(self) -> NoiseModel:
        """
        Generates a Qiskit Aer NoiseModel based on the current hardware profile T1/T2 parameters.
        """
        noise_model = NoiseModel()
        
        # If ideal, return an empty noise model
        if self.current_profile.name == "ideal":
            return noise_model

        t1 = self.current_profile.t1
        t2 = self.current_profile.t2
        
        # T2 <= 2*T1 is a physical requirement
        # Adjusted silently for basic simulation purposes if violated 
        if t2 > 2 * t1:
            t2 = 2 * t1 

        gt1 = self.current_profile.gate_time_1q
        gt2 = self.current_profile.gate_time_2q

        # Generate thermal relaxation errors
        error_1q = thermal_relaxation_error(t1, t2, gt1)
        # Expand 1Q error to 2Q gates (simplified independent error model)
        error_2q = error_1q.tensor(error_1q) 
        
        # Add errors to standard gates
        noise_model.add_all_qubit_quantum_error(error_1q, ['u1', 'u2', 'u3', 'rx', 'ry', 'rz', 'x', 'y', 'z', 'h'])
        noise_model.add_all_qubit_quantum_error(error_2q, ['cx', 'cy', 'cz', 'swap'])
        
        # NOTE: Custom gates mapping to 'unitary' instructions might need explicit binding in qiskit
        noise_model.add_all_qubit_quantum_error(error_1q, ['unitary'])

        return noise_model
