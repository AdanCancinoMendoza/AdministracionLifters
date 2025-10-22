// src/api/serpapi.ts
import axios from "axios";

export const buscarLugar = async (query: string) => {
  const API_KEY = "f82ef6dc2e7cdf623d2739e4abec6ea9bbd531485d0b5ef52c20e88fce4b71ab";

  try {
    const response = await axios.get(
      `https://serpapi.com/search.json`,
      {
        params: {
          engine: "google_maps",
          q: query,
          type: "search",
          api_key: API_KEY,
        },
      }
    );

    // Retornamos solo resultados útiles
    return response.data.local_results || [];
  } catch (error) {
    console.error("Error buscando lugar:", error);
    return [];
  }
};
