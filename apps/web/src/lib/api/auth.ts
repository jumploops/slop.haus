import { apiGet, apiDelete, apiPost } from "../api";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "user" | "mod" | "admin";
  devVerified: boolean;
  providers: string[];
  hasGitHub: boolean;
  hasGoogle: boolean;
}

export interface LinkedAccount {
  provider: string;
  accountId: string;
}

export interface DevCredentialStatus {
  hasCredential: boolean;
}

export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const response = await apiGet<{ user: CurrentUser | null }>("/auth/me");
  return response.user;
}

export async function fetchLinkedAccounts(): Promise<LinkedAccount[]> {
  const response = await apiGet<{ accounts: LinkedAccount[] }>("/auth/accounts");
  return response.accounts;
}

export async function unlinkAccount(provider: string): Promise<void> {
  await apiDelete(`/auth/unlink/${provider}`);
}

export async function issueDevCredential(): Promise<void> {
  await apiPost("/auth/dev-credential");
}

export async function checkDevCredential(): Promise<boolean> {
  const response = await apiGet<DevCredentialStatus>("/auth/dev-credential");
  return response.hasCredential;
}
