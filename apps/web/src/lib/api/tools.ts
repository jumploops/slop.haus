import { apiGet } from "../api";

export interface Tool {
  id: string;
  name: string;
  slug: string;
}

export async function fetchTools(search?: string): Promise<Tool[]> {
  const params = search ? `?q=${encodeURIComponent(search)}` : "";
  const response = await apiGet<{ tools: Tool[] }>(`/tools${params}`);
  return response.tools;
}
