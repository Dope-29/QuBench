# QuBench Technical Skills Matrix

This document outlines the core technical skills, frameworks, and conceptual knowledge required to effectively implement the QuBench "Hybrid Cloud/Local" architecture.

## 1. Backend & Machine Engine Skills
**Core Technologies**: Python 3.x, FastAPI.
* **API Architecture & Concurrency**: 
  * Experience with asynchronous Python (`asyncio`) and building RESTful interfaces using `FastAPI`.
  * Implementing WebSocket servers to broadcast high-frequency physics data (JSON packets containing coordinates, fidelity, and QMS).
* **Scientific Computing & Validation**:
  * Proficient use of `NumPy` and `SciPy` to construct and validate complex unitary matrices.
  * Experience translating parsed strings (like interpreted LaTeX structures) into programmable mathematical objects.
* **Quantum Computing Frameworks**:
  * **Qiskit**: Building and managing `QuantumCircuit` workflows, measuring resource overhead (gate count, circuit depth), and calculating statevectors.
  * **Qiskit Aer (`qiskit_aer.noise`)**: Constructing custom hardware noise profiles to simulate T1 (Thermal Relaxation) and T2 (Dephasing) errors natively against experimental circuits.
* **Deterministic Simulation**:
  * Implementing controllable PRNG (Pseudo-Random Number Generation) seeds so experimental error cascades remain reproducible.

## 2. Frontend & Visualization Skills
**Core Technologies**: React, Three.js (`react-three-fiber`).
* **React State & Component Architecture**:
  * Managing high-frequency state updates efficiently without breaking UI performance.
  * Integration with external drag-and-drop layout engines (e.g., `dnd-kit`) to build a responsive Quantum Circuit Builder.
* **3D Graphics & Mathematical Rendering**:
  * Expertise with `Three.js` and React derivatives (`react-three-fiber`, `@react-three/drei`) to generate interactive 3D visualizations—specifically charting the Bloch Sphere, Hilbert space, and complex vector shifts.
  * Integrating LaTeX rendering layers within React components (e.g., using `KaTeX` or `MathJax`) for real-time formula generation.
* **Data Visualization**:
  * Handling comparative analytics formatting using data-vis libraries (e.g., `Recharts` or `D3.js`) for clear metrics and Quantum Merit Scores.

## 3. Product & Subject Matter Knowledge
* **Quantum Information Theory basics**:
  * Understanding of Qubit logic ($|0\rangle$, $|1\rangle$), phase, and superposition fundamentals.
  * Awareness of decoherence events limits (Energy loss vs. Dephasing) to build a credible "Physicality Engine".
* **Architecture Principles**:
  * Understanding Producer-Consumer architectures (Backend calculating complex math -> streaming to Frontend for fluid visualization).
