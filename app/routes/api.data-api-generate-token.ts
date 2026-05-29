import type { Route } from "./+types/api.data-api-generate-token";

export async function loader({ context }: Route.LoaderArgs) {
  const result = await context.cloudflare.env.CORE_APP_DB
    .prepare("SELECT * FROM data_api_tokens ORDER BY rowid DESC LIMIT 1")
    .first();
    
  return Response.json(result);
}