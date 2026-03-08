import numpy as np
from sympy import I, pi, exp, cos, sin, Matrix

import sys
import typing
# Monkey-patch typing.io for older antlr4-python3-runtime compatibility with Python 3.9+
sys.modules['typing.io'] = typing

from latex2sympy2 import latex2sympy

class FormulaTranspiler:
    def __init__(self):
        pass

    def latex_to_matrix(self, latex_str: str) -> np.ndarray:
        """
        Parses a LaTeX string into a SymPy expression, evaluates it to a numerical matrix,
        and returns it as a NumPy array.
        """
        try:
            # latex2sympy returns a SymPy object
            sympy_expr = latex2sympy(latex_str)
            
            # If it's not already a matrix, this might fail or be a scalar. 
            # Assuming the user inputs a matrix form: \begin{pmatrix} ... \end{pmatrix}
            if not isinstance(sympy_expr, Matrix):
                raise ValueError("Parsed formula is not a matrix.")
                
            # Convert SymPy matrix to complex numpy array explicitly evaluating with evalf()
            np_matrix = np.array(sympy_expr.evalf().tolist(), dtype=np.complex128)
            return np_matrix
            
        except Exception as e:
            raise ValueError(f"Failed to transpile LaTeX formula: {str(e)}")

    def is_unitary(self, matrix: np.ndarray, tolerance: float = 1e-10) -> bool:
        """
        Validates if a given matrix is unitary (U^\\dagger U = I).
        """
        # Calculate the conjugate transpose (dagger)
        dagger = np.conjugate(matrix.T)
        
        # Multiply U^\dagger U
        identity_approx = np.dot(dagger, matrix)
        
        # Create true identity matrix of same shape
        identity_true = np.eye(matrix.shape[0], dtype=np.complex128)
        
        # Check if the result is close enough to the identity matrix
        return np.allclose(identity_approx, identity_true, atol=tolerance)

    def process_custom_gate(self, latex_str: str):
        """
        Full pipeline: parse LaTeX -> matrix -> validate unitarity -> return.
        """
        matrix = self.latex_to_matrix(latex_str)
        if not self.is_unitary(matrix):
            raise ValueError("The provided formula does not produce a valid unitary matrix.")
            
        return matrix
