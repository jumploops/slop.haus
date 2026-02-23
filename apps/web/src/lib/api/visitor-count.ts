import { apiGet } from "../api";

interface VisitorCountResponse {
  value: number;
}

export async function fetchVisitorCount(): Promise<number> {
  const response = await apiGet<VisitorCountResponse>("/visitor-count");
  return response.value;
}
