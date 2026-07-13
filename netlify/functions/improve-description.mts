import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { description } = await req.json();
    if (!description || typeof description !== "string") {
      return new Response(JSON.stringify({ error: "La descripción es requerida." }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    const apiKey = Netlify.env.get("GROQ_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key de Groq no configurada en Netlify." }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Actúa como un redactor publicitario experto. Tu tarea es optimizar la descripción de un artículo en venta de garaje. Corrige errores ortográficos y de puntuación, mejora la redacción para hacerla más clara, fluida y persuasiva. Es sumamente importante que conserves todos los datos específicos como dimensiones, marca, modelo y estado real del producto. Devuelve ÚNICAMENTE la descripción optimizada final en español, sin saludos, explicaciones, ni etiquetas de código adicionales."
          },
          {
            role: "user",
            content: description
          }
        ],
        temperature: 0.7,
        max_tokens: 600
      })
    });

    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const improved = data.choices[0].message.content.trim();
      return new Response(JSON.stringify({ improved }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } else {
      console.error("Groq API Error:", data);
      return new Response(JSON.stringify({ error: "Error al comunicarse con la API de Groq." }), {
        status: 502,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  } catch (error: any) {
    console.error("Improve description error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};

export const config: Config = {
  path: "/api/improve-description"
};
