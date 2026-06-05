import type { Route } from "./+types/api.epf-validate-contact";

export async function loader({ context, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const searchValue = url.searchParams.get("search_value");
  

  interface EpfClient {
    ClientID: number;
    ContactID: number;
    ExternalID: number | string;
  }

  interface EpfResponse {
    EpfRebalancer: EpfClient[];
  }


   // --- Auth: require a valid bearer token on the incoming request ---
  const authHeader = request.headers.get("Authorization");
  const incomingToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!incomingToken || incomingToken !== context.cloudflare.env.API_AUTH_TOKEN_EPF_VALIDATE_CLIENT) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  // -----------------------------------------------------------------


  if (!searchValue) {
    return Response.json({ error: "search_value is required" }, { status: 400 });
  }

  // Get Latest Valid Token
  const validToken = await context.cloudflare.env.CORE_APP_DB
    .prepare("SELECT * FROM data_api_tokens ORDER BY rowid DESC LIMIT 1")
    .first();


  // Call external API with bearer token
  const apiResponse = await fetch(
    `https://api.pacificdebt.com:14344/api/EpfRebalancer/GetClientList`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${validToken?.token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!apiResponse.ok) {
    return Response.json(
      { error: "External API request failed" },
      { status: apiResponse.status }
    );
  }

  const allClient = (await apiResponse.json()) as EpfResponse;



  const clientSearchParam = parseInt(searchValue, 10);

  if (isNaN(clientSearchParam)) {
    return Response.json({ error: "search_value must be a number" }, { status: 400 });
  }

  const clientData = allClient.EpfRebalancer.filter(item =>
    item.ClientID === clientSearchParam ||
    item.ContactID === clientSearchParam ||
    item.ExternalID === clientSearchParam
  );

  return Response.json(clientData);
}