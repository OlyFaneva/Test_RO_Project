"use client"

import { useRef } from "react"

interface Node {
  id: number
  x: number
  y: number
  label: string
}

interface Edge {
  from: number
  to: number
  weight: string | number
  isOptimal?: boolean
}

interface GraphVisualizationProps {
  matrix: string[][]
  optimalPath?: number[] | null
  mode: string
}

export function GraphVisualization({ matrix, optimalPath, mode }: GraphVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const n = matrix.length

  const nodes: Node[] = Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2 // Start from top
    const radius = Math.min(150, 50 + n * 8)
    return {
      id: i + 1,
      x: 200 + radius * Math.cos(angle),
      y: 200 + radius * Math.sin(angle),
      label: (i + 1).toString(),
    }
  })

  const edges: Edge[] = []
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        const weight = matrix[i][j]
        if ((mode === "min" && weight !== "inf") || (mode === "max" && weight !== "-inf" && weight !== "0")) {
          const isOptimal = optimalPath
            ? optimalPath.some(
                (node, idx) => idx < optimalPath.length - 1 && node === i + 1 && optimalPath[idx + 1] === j + 1,
              )
            : false

          edges.push({
            from: i + 1,
            to: j + 1,
            weight: weight,
            isOptimal,
          })
        }
      }
    }
  }

  const formatWeight = (weight: string | number) => {
    if (weight === "inf") return "∞"
    if (weight === "-inf") return "-∞"
    return weight.toString()
  }

  const getArrowPosition = (fromNode: Node, toNode: Node) => {
    const dx = toNode.x - fromNode.x
    const dy = toNode.y - fromNode.y
    const length = Math.sqrt(dx * dx + dy * dy)
    const unitX = dx / length
    const unitY = dy / length

    // Position arrow at edge of target node (radius = 20)
    const arrowX = toNode.x - unitX * 25
    const arrowY = toNode.y - unitY * 25

    return { x: arrowX, y: arrowY, angle: Math.atan2(dy, dx) }
  }

  return (
    <div className="w-full flex justify-center">
      <svg
        ref={svgRef}
        width="400"
        height="400"
        viewBox="0 0 400 400"
        className="border border-slate-200 rounded-lg bg-white"
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
          </marker>
          <marker id="arrowhead-optimal" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#dc2626" />
          </marker>
        </defs>

        {edges.map((edge, idx) => {
          const fromNode = nodes.find((n) => n.id === edge.from)!
          const toNode = nodes.find((n) => n.id === edge.to)!
          const arrow = getArrowPosition(fromNode, toNode)

          return (
            <g key={`edge-${idx}`}>
              {/* Edge line */}
              <line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={arrow.x}
                y2={arrow.y}
                stroke={edge.isOptimal ? "#dc2626" : "#64748b"}
                strokeWidth={edge.isOptimal ? "3" : "1.5"}
                markerEnd={edge.isOptimal ? "url(#arrowhead-optimal)" : "url(#arrowhead)"}
              />

              {/* Weight label */}
              <text
                x={(fromNode.x + toNode.x) / 2}
                y={(fromNode.y + toNode.y) / 2 - 5}
                textAnchor="middle"
                fontSize="12"
                fill={edge.isOptimal ? "#dc2626" : "#374151"}
                fontWeight={edge.isOptimal ? "bold" : "normal"}
                className="select-none"
              >
                {formatWeight(edge.weight)}
              </text>
            </g>
          )
        })}

        {nodes.map((node) => {
          const isStartOrEnd =
            optimalPath && (node.id === optimalPath[0] || node.id === optimalPath[optimalPath.length - 1])
          const isOnPath = optimalPath?.includes(node.id)

          return (
            <g key={`node-${node.id}`}>
              {/* Node circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r="20"
                fill={isStartOrEnd ? "#fbbf24" : isOnPath ? "#fca5a5" : "#e2e8f0"}
                stroke={isStartOrEnd ? "#f59e0b" : isOnPath ? "#dc2626" : "#64748b"}
                strokeWidth="2"
              />

              {/* Node label */}
              <text
                x={node.x}
                y={node.y + 5}
                textAnchor="middle"
                fontSize="14"
                fontWeight="bold"
                fill="#1f2937"
                className="select-none"
              >
                {node.label}
              </text>
            </g>
          )
        })}

        <g transform="translate(10, 350)">
          <text x="0" y="0" fontSize="10" fill="#64748b" fontWeight="bold">
            Légende:
          </text>
          <circle cx="8" cy="15" r="6" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
          <text x="20" y="19" fontSize="9" fill="#64748b">
            Début/Fin
          </text>
          <circle cx="8" cy="30" r="6" fill="#fca5a5" stroke="#dc2626" strokeWidth="1" />
          <text x="20" y="34" fontSize="9" fill="#64748b">
            Chemin optimal
          </text>
          <line x1="80" y1="15" x2="100" y2="15" stroke="#dc2626" strokeWidth="2" markerEnd="url(#arrowhead-optimal)" />
          <text x="105" y="19" fontSize="9" fill="#64748b">
            Arête optimale
          </text>
        </g>
      </svg>
    </div>
  )
}
