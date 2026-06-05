import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("api/data", "routes/api.data.ts"),
	route("api/GetToken", "routes/api.data-api-generate-token.ts"),
	
	route("api/EPF/ValidateClient", "routes/api.epf-validate-contact.ts"),
	route("api/EPF/GetDebtSummaryByClientID", "routes/api.epf-client-debt-summary.ts"),
] satisfies RouteConfig;
