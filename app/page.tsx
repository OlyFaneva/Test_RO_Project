"use client"

import { useState } from "react"
import {
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Network,
  Calculator,
  TrendingUp,
  TestTube,
  Wifi,
  WifiOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GraphVisualization } from "@/components/graph-visualization"

interface AlgorithmResults {
  matrices: string[][]
  final_matrix: string[][]
  path: number[] | null
  cost: number | string
  n: number
  mode: string
}

export default function DemoucronApp() {
  const [matrixInput, setMatrixInput] = useState(`0 3 inf inf inf
inf 0 inf 2 6
8 inf 0 inf 1
inf inf 2 0 3
inf inf inf inf 0`)
  const [mode, setMode] = useState("min")
  const [results, setResults] = useState<AlgorithmResults | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [serverStatus, setServerStatus] = useState<"unknown" | "connected" | "disconnected">("unknown")

  // URLs alternatives à tester
  const API_URLS = ["http://localhost:5001", "http://127.0.0.1:5001", "http://0.0.0.0:5001"]

  const testConnection = async () => {
    setServerStatus("unknown")

    for (const baseUrl of API_URLS) {
      try {
        console.log(`Test de connexion à ${baseUrl}...`)
        const response = await fetch(`${baseUrl}/api/health`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log(`✅ Connexion réussie à ${baseUrl}:`, data)
          setServerStatus("connected")
          setError("")
          alert(`✅ Connexion réussie à ${baseUrl}!\nStatut: ${data.status}\nMessage: ${data.message}`)
          return baseUrl // Retourner l'URL qui fonctionne
        }
      } catch (err) {
        console.log(`❌ Échec de connexion à ${baseUrl}:`, err)
      }
    }

    setServerStatus("disconnected")
    setError("❌ Impossible de se connecter au serveur Flask. Vérifiez qu'il est démarré sur le port 5001.")
    return null
  }

  const processMatrix = async () => {
    setLoading(true)
    setError("")

    try {
      // Parser la matrice avec une validation plus robuste
      const lines = matrixInput
        .trim()
        .split("\n")
        .filter((line) => line.trim() !== "")

      if (lines.length === 0) {
        throw new Error("La matrice est vide")
      }

      const matrix = lines.map((line, i) => {
        const values = line
          .trim()
          .split(/\s+/)
          .filter((val) => val !== "")
        if (values.length === 0) {
          throw new Error(`Ligne ${i + 1} est vide`)
        }
        return values.map((val, j) => {
          const cleanVal = val.toLowerCase().trim()
          if (cleanVal === "inf" || cleanVal === "infinity") {
            return "inf"
          } else if (cleanVal === "-inf" || cleanVal === "-infinity") {
            return "-inf"
          } else if (cleanVal === "" || cleanVal === "none") {
            return mode === "min" ? "inf" : "-inf"
          } else {
            // Vérifier que c'est un nombre valide
            const num = Number.parseFloat(val)
            if (isNaN(num)) {
              throw new Error(`Valeur invalide "${val}" à la ligne ${i + 1}, colonne ${j + 1}`)
            }
            return val
          }
        })
      })

      // Vérifier que la matrice est carrée
      const n = matrix.length
      for (let i = 0; i < matrix.length; i++) {
        if (matrix[i].length !== n) {
          throw new Error(`La matrice n'est pas carrée. Ligne ${i + 1} a ${matrix[i].length} colonnes, attendu ${n}`)
        }
      }

      console.log("Matrice à envoyer:", matrix)

      // Tester plusieurs URLs si nécessaire
      let response = null
      let lastError = null

      for (const baseUrl of API_URLS) {
        try {
          console.log(`Tentative avec ${baseUrl}...`)
          response = await fetch(`${baseUrl}/api/process`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              matrix: matrix,
              mode: mode,
            }),
          })

          if (response.ok) {
            console.log(`✅ Succès avec ${baseUrl}`)
            break
          } else {
            console.log(`❌ Échec avec ${baseUrl}: ${response.status}`)
            lastError = `HTTP ${response.status}`
          }
        } catch (err) {
          console.log(`❌ Erreur avec ${baseUrl}:`, err)
          lastError = err
          response = null
        }
      }

      if (!response || !response.ok) {
        throw new Error(`Impossible de se connecter au serveur. Dernière erreur: ${lastError}`)
      }

      const data = await response.json()
      console.log("Réponse du serveur:", data)

      if (data.success) {
        setResults(data.results)
        setCurrentStep(0)
        setError("")
        setServerStatus("connected")
      } else {
        setError(data.message || "Erreur inconnue du serveur")
        setServerStatus("disconnected")
      }
    } catch (err) {
      console.error("Erreur:", err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Erreur de connexion au serveur.")
      }
      setServerStatus("disconnected")
    } finally {
      setLoading(false)
    }
  }

  const clearMatrix = () => {
    setMatrixInput("")
    setResults(null)
    setCurrentStep(0)
    setError("")
  }

  const loadExample = (example: string) => {
    const examples = {
      simple: `0 3 inf inf inf
inf 0 inf 2 6
8 inf 0 inf 1
inf inf 2 0 3
inf inf inf inf 0`,
      small: `0 1 4
inf 0 2
inf inf 0`,
      max: `0 3 0 0 0
0 0 0 2 6
8 0 0 0 1
0 0 2 0 3
0 0 0 0 0`,
    }
    setMatrixInput(examples[example as keyof typeof examples] || examples.simple)
  }

  const formatValue = (val: string | number) => {
    if (val === "inf") return "∞"
    if (val === "-inf") return "-∞"
    if (typeof val === "number") {
      return Number.isInteger(val) ? val.toString() : val.toFixed(1)
    }
    return val.toString()
  }

  const MatrixDisplay = ({
    matrix,
    title,
    highlightChanges = false,
    prevMatrix = null,
  }: {
    matrix: string[][]
    title: string
    highlightChanges?: boolean
    prevMatrix?: string[][] | null
  }) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <div className="overflow-x-auto">
        <table className="border-collapse border border-slate-300 mx-auto">
          <thead>
            <tr>
              <th className="border border-slate-300 bg-slate-100 p-2 text-sm font-bold">i/j</th>
              {Array.from({ length: matrix.length }, (_, i) => (
                <th key={i} className="border border-slate-300 bg-slate-100 p-2 text-sm font-bold">
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <th className="border border-slate-300 bg-slate-100 p-2 text-sm font-bold">{i + 1}</th>
                {row.map((cell, j) => {
                  const isChanged = highlightChanges && prevMatrix && prevMatrix[i][j] !== cell
                  const isOptimal = i === 0 && j === matrix.length - 1 && title.includes("Finale")

                  return (
                    <td
                      key={j}
                      className={`border border-slate-300 p-2 text-center text-sm font-mono ${
                        isOptimal
                          ? "bg-yellow-200 font-bold"
                          : isChanged
                            ? "bg-red-100 text-red-700 font-semibold"
                            : "bg-white"
                      }`}
                    >
                      {formatValue(cell)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Network className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-900">Algorithme de Demoucron</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={testConnection}>
                {serverStatus === "connected" ? (
                  <Wifi className="h-4 w-4 mr-2 text-green-600" />
                ) : serverStatus === "disconnected" ? (
                  <WifiOff className="h-4 w-4 mr-2 text-red-600" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Test Connexion
              </Button>
              <Badge variant={serverStatus === "connected" ? "default" : "destructive"} className="text-sm">
                {serverStatus === "connected" ? "Connecté" : serverStatus === "disconnected" ? "Déconnecté" : "Inconnu"}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="input" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="input" className="flex items-center space-x-2">
              <Calculator className="h-4 w-4" />
              <span>Saisie Matrice</span>
            </TabsTrigger>
            <TabsTrigger value="steps" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Étapes</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center space-x-2">
              <Network className="h-4 w-4" />
              <span>Résultats</span>
            </TabsTrigger>
          </TabsList>

          {/* Onglet Saisie */}
          <TabsContent value="input" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration de la Matrice</CardTitle>
                <CardDescription>
                  Entrez la matrice d'adjacence (une ligne par sommet, valeurs séparées par des espaces)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* Statut de connexion */}
                  {serverStatus === "disconnected" && (
                    <Alert variant="destructive">
                      <WifiOff className="h-4 w-4" />
                      <AlertDescription>
                        Serveur Flask non accessible. Assurez-vous qu'il est démarré avec :
                        <code className="ml-2 bg-slate-100 px-2 py-1 rounded">python3 scripts/flask_server.py</code>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Exemples prédéfinis */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Exemples prédéfinis</Label>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => loadExample("simple")}>
                        Exemple 5x5
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => loadExample("small")}>
                        Exemple 3x3
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => loadExample("max")}>
                        Maximisation
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="matrix" className="text-sm font-medium">
                      Matrice d'adjacence
                    </Label>
                    <Textarea
                      id="matrix"
                      value={matrixInput}
                      onChange={(e) => setMatrixInput(e.target.value)}
                      className="font-mono text-sm mt-2"
                      rows={8}
                      placeholder="0 3 inf inf inf&#10;inf 0 inf 2 6&#10;8 inf 0 inf 1&#10;inf inf 2 0 3&#10;inf inf inf inf 0"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-3 block">Type de matrice</Label>
                    <RadioGroup value={mode} onValueChange={setMode} className="flex space-x-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="min" id="min" />
                        <Label htmlFor="min">Minimisation (inf = ∞)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="max" id="max" />
                        <Label htmlFor="max">Maximisation (0 = pas d'arête)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex space-x-4">
                    <Button onClick={processMatrix} disabled={loading} className="flex items-center space-x-2">
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      <span>{loading ? "Traitement..." : "Appliquer l'Algorithme"}</span>
                    </Button>
                    <Button variant="outline" onClick={clearMatrix}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Effacer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Étapes */}
          <TabsContent value="steps" className="space-y-6">
            {results ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        {currentStep === 0 ? "Matrice Initiale (D₀)" : `Étape ${currentStep} (D${currentStep})`}
                      </CardTitle>
                      <CardDescription>
                        {currentStep === 0
                          ? "Matrice initiale avec les poids des arcs directs"
                          : `Considération du sommet k=${currentStep} comme intermédiaire`}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      Étape {currentStep} / {results.n}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <MatrixDisplay
                    matrix={results.matrices[currentStep]}
                    title={currentStep === 0 ? "Matrice Initiale" : `Matrice à l'étape ${currentStep}`}
                    highlightChanges={currentStep > 0}
                    prevMatrix={currentStep > 0 ? results.matrices[currentStep - 1] : null}
                  />

                  {currentStep > 0 && (
                    <Alert>
                      <AlertDescription>
                        À cette étape, nous considérons le sommet k={currentStep} comme intermédiaire. Pour chaque paire
                        (i,j), nous comparons le chemin direct avec le chemin passant par k. Les valeurs modifiées sont
                        surlignées en rouge.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                      disabled={currentStep === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(Math.min(results.n, currentStep + 1))}
                      disabled={currentStep === results.n}
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Network className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">Veuillez d'abord traiter une matrice dans l'onglet "Saisie Matrice"</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Onglet Résultats */}
          <TabsContent value="results" className="space-y-6">
            {results ? (
              <div className="grid gap-6">
                {/* Chemin optimal */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Network className="h-5 w-5" />
                      <span>Chemin Optimal</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results.path ? (
                      <div className="space-y-4">
                        <div className="text-lg font-semibold text-blue-600">
                          Chemin de 1 à {results.n}: {results.path.join(" → ")}
                        </div>
                        <div className="text-2xl font-bold text-green-600">Coût: {formatValue(results.cost)}</div>
                      </div>
                    ) : (
                      <div className="text-lg text-red-600">Aucun chemin trouvé entre 1 et {results.n}</div>
                    )}
                  </CardContent>
                </Card>

                {/* Visualisation du Graphe */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Network className="h-5 w-5" />
                      <span>Visualisation du Graphe</span>
                    </CardTitle>
                    <CardDescription>
                      Représentation visuelle du réseau avec le chemin optimal mis en évidence
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GraphVisualization matrix={results.matrices[0]} optimalPath={results.path} mode={results.mode} />
                  </CardContent>
                </Card>

                {/* Matrice finale */}
                <Card>
                  <CardHeader>
                    <CardTitle>Matrice Finale (D{results.n})</CardTitle>
                    <CardDescription>
                      La valeur surlignée représente le coût optimal entre les sommets 1 et {results.n}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MatrixDisplay matrix={results.final_matrix} title="Matrice Finale" />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Calculator className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">Aucun résultat à afficher</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
