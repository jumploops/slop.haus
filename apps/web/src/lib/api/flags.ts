import { apiPost } from "../api";
import type { CreateFlagInput } from "@slop/shared";

export async function createFlag(data: CreateFlagInput): Promise<void> {
  await apiPost("/flags", data);
}
