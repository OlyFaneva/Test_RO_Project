from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import networkx as nx
import json

app = Flask(__name__)
CORS(app)

class DemoucronAlgorithm:
    def __init__(self):
        self.mode = "min"
        self.matrices = []
        self.next_nodes = None
        self.n = 0

    def process_matrix(self, matrix_data, mode):
        """Traite la matrice et applique l'algorithme de Demoucron"""
        try:
            self.mode = mode
            matrix = []
            
            print(f"Données reçues: {matrix_data}")  # Debug
            print(f"Mode: {mode}")  # Debug
            
            for i, row in enumerate(matrix_data):
                matrix_row = []
                for j, val in enumerate(row):
                    # Gestion robuste des valeurs
                    if val is None:
                        print(f"Valeur None détectée à [{i}][{j}]")
                        if mode == 'min':
                            matrix_row.append(np.inf)
                        else:
                            matrix_row.append(-np.inf)
                    elif isinstance(val, str):
                        val_lower = val.lower().strip()
                        if val_lower == 'inf' or val_lower == 'infinity':
                            matrix_row.append(np.inf)
                        elif val_lower == '-inf' or val_lower == '-infinity':
                            matrix_row.append(-np.inf)
                        elif val_lower == '' or val_lower == 'none':
                            # Valeur vide ou None en string
                            if mode == 'min':
                                matrix_row.append(np.inf)
                            else:
                                matrix_row.append(-np.inf)
                        else:
                            try:
                                matrix_row.append(float(val))
                            except ValueError:
                                print(f"Impossible de convertir '{val}' en float à [{i}][{j}]")
                                if mode == 'min':
                                    matrix_row.append(np.inf)
                                else:
                                    matrix_row.append(-np.inf)
                    else:
                        try:
                            matrix_row.append(float(val))
                        except (ValueError, TypeError):
                            print(f"Impossible de convertir {val} (type: {type(val)}) en float à [{i}][{j}]")
                            if mode == 'min':
                                matrix_row.append(np.inf)
                            else:
                                matrix_row.append(-np.inf)
                matrix.append(matrix_row)
            
            self.n = len(matrix)
            print(f"Matrice traitée: {matrix}")  # Debug
            
            # Vérifier que la matrice est carrée
            if any(len(row) != self.n for row in matrix):
                raise ValueError("La matrice n'est pas carrée!")
            
            # Si mode max, convertir 0 en -inf pour les arêtes inexistantes
            if self.mode == 'max':
                for i in range(self.n):
                    for j in range(self.n):
                        if i != j and matrix[i][j] == 0:
                            matrix[i][j] = -np.inf
            
            self.matrices = [matrix]
            self.apply_demoucron()
            
            return True, "Succès"
        except Exception as e:
            print(f"Erreur dans process_matrix: {e}")  # Debug
            import traceback
            traceback.print_exc()
            return False, str(e)

    def apply_demoucron(self):
        """Applique l'algorithme de Demoucron (Floyd-Warshall modifié)"""
        try:
            D = np.array(self.matrices[0], dtype=float)
            n = self.n
            
            # Initialiser next_nodes
            next_nodes = [[None]*n for _ in range(n)]
            for i in range(n):
                for j in range(n):
                    if i != j:
                        if self.mode == 'min' and D[i,j] != np.inf:
                            next_nodes[i][j] = j
                        elif self.mode == 'max' and D[i,j] != -np.inf:
                            next_nodes[i][j] = j
            
            matrices = [D.copy().tolist()]
            
            for k in range(n):
                new_D = D.copy()
                for i in range(n):
                    for j in range(n):
                        # Vérifier que les valeurs ne sont pas infinies avant l'addition
                        if self.mode == 'min':
                            if D[i,k] != np.inf and D[k,j] != np.inf:
                                new_val = D[i,k] + D[k,j]
                                if new_val < new_D[i,j]:
                                    new_D[i,j] = new_val
                                    next_nodes[i][j] = next_nodes[i][k]
                        else:  # max
                            if D[i,k] != -np.inf and D[k,j] != -np.inf:
                                new_val = D[i,k] + D[k,j]
                                if new_val > new_D[i,j]:
                                    new_D[i,j] = new_val
                                    next_nodes[i][j] = next_nodes[i][k]
                
                matrices.append(new_D.copy().tolist())
                D = new_D
            
            self.matrices = matrices
            self.next_nodes = next_nodes
            
        except Exception as e:
            print(f"Erreur dans apply_demoucron: {e}")
            import traceback
            traceback.print_exc()
            raise

    def reconstruct_path(self, u, v):
        """Reconstruit le chemin de u vers v"""
        try:
            if self.next_nodes is None or self.next_nodes[u][v] is None:
                return None
            
            path = [u]
            current = u
            visited = set([u])  # Pour éviter les boucles infinies
            
            while current != v:
                next_node = self.next_nodes[current][v]
                if next_node is None or next_node in visited or len(path) > self.n:
                    return None
                path.append(next_node)
                visited.add(next_node)
                current = next_node
            
            return path
        except Exception as e:
            print(f"Erreur dans reconstruct_path: {e}")
            return None

    def get_results(self):
        """Retourne les résultats formatés pour l'API"""
        try:
            if not self.matrices:
                return None
            
            final_matrix = self.matrices[-1]
            start, end = 0, self.n - 1
            
            # Reconstruire le chemin
            path = self.reconstruct_path(start, end)
            
            # Calculer le coût
            cost = final_matrix[start][end] if len(final_matrix) > start and len(final_matrix[start]) > end else None
            
            # Convertir les valeurs inf pour JSON
            def convert_for_json(matrix):
                result = []
                for row in matrix:
                    json_row = []
                    for val in row:
                        if val is None:
                            json_row.append("inf")
                        elif np.isnan(val):
                            json_row.append("inf")
                        elif val == np.inf:
                            json_row.append("inf")
                        elif val == -np.inf:
                            json_row.append("-inf")
                        else:
                            try:
                                json_row.append(float(val))
                            except (ValueError, TypeError):
                                json_row.append("inf")
                    result.append(json_row)
                return result
            
            # Convertir le coût
            if cost is None:
                cost_str = "inf"
            elif np.isnan(cost):
                cost_str = "inf"
            elif cost == np.inf:
                cost_str = "inf"
            elif cost == -np.inf:
                cost_str = "-inf"
            else:
                try:
                    cost_str = float(cost)
                except (ValueError, TypeError):
                    cost_str = "inf"
            
            return {
                'matrices': [convert_for_json(m) for m in self.matrices],
                'final_matrix': convert_for_json(final_matrix),
                'path': [p + 1 for p in path] if path else None,  # Convertir en 1-based
                'cost': cost_str,
                'n': self.n,
                'mode': self.mode
            }
            
        except Exception as e:
            print(f"Erreur dans get_results: {e}")
            import traceback
            traceback.print_exc()
            return None

# Instance globale de l'algorithme
algorithm = DemoucronAlgorithm()

@app.route('/api/process', methods=['POST'])
def process_matrix():
    """Endpoint pour traiter une matrice"""
    try:
        data = request.json
        print(f"Données reçues: {data}")  # Debug
        
        matrix_data = data.get('matrix', [])
        mode = data.get('mode', 'min')
        
        if not matrix_data:
            return jsonify({
                'success': False,
                'message': 'Aucune matrice fournie'
            }), 400
        
        success, message = algorithm.process_matrix(matrix_data, mode)
        
        if success:
            results = algorithm.get_results()
            if results is None:
                return jsonify({
                    'success': False,
                    'message': 'Erreur lors de la génération des résultats'
                }), 500
            
            return jsonify({
                'success': True,
                'results': results,
                'message': message
            })
        else:
            return jsonify({
                'success': False,
                'message': message
            }), 400
            
    except Exception as e:
        print(f"Erreur dans l'endpoint process: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Erreur serveur: {str(e)}'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint de vérification de santé"""
    return jsonify({'status': 'OK', 'message': 'Serveur Demoucron actif'})

@app.route('/api/test', methods=['POST'])
def test_endpoint():
    """Endpoint de test pour déboguer"""
    try:
        data = request.json
        return jsonify({
            'received_data': data,
            'data_type': str(type(data)),
            'matrix_type': str(type(data.get('matrix', []))) if data else 'No data'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Serveur Demoucron démarré sur http://localhost:5001")
    print("Endpoints disponibles:")
    print("- POST /api/process : Traiter une matrice")
    print("- GET /api/health : Vérifier le statut")
    print("- POST /api/test : Test de débogage")
    app.run(debug=True, port=5001)
