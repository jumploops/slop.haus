import { apiGet, apiDelete, apiPost } from "../api";

export interface CurrentUser {
  id: string;
  username: string;
  usernameSource: "github" | "google_random" | "manual" | "seed";
  email: string;
  image: string | null;
  role: "user" | "mod" | "admin";
  devVerified: boolean;
  isAnonymous: boolean;
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

export interface GitHubRepoSummary {
  id: number;
  name: string;
  fullName: string;
  htmlUrl: string;
  description: string | null;
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  language: string | null;
  stargazersCount: number;
  updatedAt: string;
}

export interface GitHubRepoListResponse {
  githubLinked: boolean;
  repos: GitHubRepoSummary[];
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

export async function fetchGitHubRepos(): Promise<GitHubRepoListResponse> {
  return apiGet<GitHubRepoListResponse>("/auth/github/repos");
}
