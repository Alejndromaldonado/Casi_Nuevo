import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  const { next_run } = await req.json();
  console.log("Supabase ping job started. Next run scheduled for:", next_run);

  const supabaseUrl = Netlify.env.get("SUPABASE_URL");
  const supabaseKey = Netlify.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.");
    return;
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/products?select=id&limit=1`, {
      method: "GET",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Successfully pinged Supabase. Data returned:", data);
    } else {
      console.error("Ping failed with status:", response.status, response.statusText);
    }
  } catch (error) {
    console.error("Error pinging Supabase:", error);
  }
};

export const config: Config = {
  schedule: "0 8 */3 * *" // Runs every 3 days at 8:00 UTC
};
