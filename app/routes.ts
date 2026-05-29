import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("api/data", "routes/api.data.ts"),
	route("api/GetToken", "routes/api.data-api-generate-token.ts"),
] satisfies RouteConfig;
