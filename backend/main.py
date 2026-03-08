import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from engine.transpiler import FormulaTranspiler
from engine.physicality import PhysicalityEngine
from engine.evaluator import CircuitEvaluator

app = FastAPI(title="QuBench Backend Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

transpiler = FormulaTranspiler()

# --- Models ---
class CustomGateRequest(BaseModel):
    latex_formula: str

class GateInstruction(BaseModel):
    name: str # e.g 'h', 'cx', or custom gate id string
    qubits: List[int]
    is_custom: bool = False
    latex_formula: Optional[str] = None

class SimulationRequest(BaseModel):
    num_qubits: int
    instructions: List[GateInstruction]
    hardware_profile: str = "ideal"
    seed: Optional[int] = None

# --- REST Endpoints ---
@app.get("/")
def read_root():
    return {"status": "QuBench Quantum Discovery Engine is Online."}

@app.post("/api/transpile")
def transpile_custom_gate(request: CustomGateRequest):
    """
    Validates a LaTeX formula to ensure it creates a valid unitary matrix.
    """
    try:
        matrix = transpiler.process_custom_gate(request.latex_formula)
        return {
            "status": "success",
            "message": "Formula is mathematically unitary",
            "matrix_shape": matrix.shape,
            # We return real/imag components for potential frontend inspection
            "matrix": [{"real": v.real, "imag": v.imag} for v in matrix.flatten()]
        }
    except ValueError as e:
        return {"status": "error", "message": str(e)}

# --- WebSockets ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/simulate")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Wait for physics simulation requests from frontend
            data = await websocket.receive_text()
            req_data = json.loads(data)
            
            try:
                sim_req = SimulationRequest(**req_data)
                
                # 1. Setup Environment
                evaluator = CircuitEvaluator(num_qubits=sim_req.num_qubits)
                phys_engine = PhysicalityEngine(seed=sim_req.seed)
                phys_engine.set_profile(sim_req.hardware_profile)
                noise_model = phys_engine.generate_noise_model()
                
                # 2. Build Circuit
                for instr in sim_req.instructions:
                    matrix = None
                    if instr.is_custom and instr.latex_formula:
                        # Convert on the fly, assuming pre-validated by frontend or previous api call
                        matrix = transpiler.process_custom_gate(instr.latex_formula)
                    
                    evaluator.append_gate(instr.name, instr.qubits, matrix)
                    
                    # Optional: We could stream states after *every* gate here if we want step-by-step
                    # but for performance, we'll evaluate at the end of the circuit
                
                # 3. Process & Evaluate
                result = evaluator.simulate_state(noise_model=noise_model, seed=sim_req.seed)
                qms_score = evaluator.calculate_qms(result)
                
                # 4. Format the Data Packet (Ref SDD 3.1)
                response_payload = {
                    "type": "simulation_result",
                    "num_qubits": sim_req.num_qubits,
                    "metrics": result["metrics"],
                    "qms_score": round(qms_score, 2),
                    "is_pure": result["is_pure"],
                    "bloch_vectors": result["bloch_vectors"]
                    # We are intentionally not sending the massive statevector array over WS
                    # to prevent UI lockup unless requested.
                }
                
                await manager.send_personal_message(json.dumps(response_payload), websocket)
                
            except Exception as e:
                error_payload = {"type": "error", "message": f"Simulation failed: {str(e)}"}
                await manager.send_personal_message(json.dumps(error_payload), websocket)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
