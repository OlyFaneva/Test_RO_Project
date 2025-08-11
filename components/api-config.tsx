"use client"

// Configuration pour l'API Flask
export const API_CONFIG = {
  BASE_URL: "http://localhost:5000",
  ENDPOINTS: {
    PROCESS: "/api/process",
    HEALTH: "/api/health",
  },
}

// Fonction utilitaire pour les appels API
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  }

  try {
    const response = await fetch(url, defaultOptions)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("API call failed:", error)
    throw error
  }
}
