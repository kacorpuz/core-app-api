import type { Route } from "./+types/api.data";

export async function loader({ context, request }: Route.LoaderArgs) {
	const upstream = context.cloudflare.env.UPSTREAM_API_URL;

	if (!upstream) {
		return Response.json(
			{ error: "UPSTREAM_API_URL is not configured" },
			{ status: 500 },
		);
	}

	const incoming = new URL(request.url);
	const target = new URL(upstream);
	incoming.searchParams.forEach((value, key) => {
		target.searchParams.set(key, value);
	});

	const upstreamResponse = await fetch(target, {
		headers: { accept: "application/json" },
	});

	if (!upstreamResponse.ok) {
		return Response.json(
			{
				error: "Upstream request failed",
				status: upstreamResponse.status,
			},
			{ status: 502 },
		);
	}

	const data = await upstreamResponse.json();
	return Response.json(data);
}
