/**
 * Adapter interface for developer data collectors.
 * Each developer gets its own adapter implementing this interface.
 */

export interface CollectorConfig {
  /** Developer slug (e.g. "sminex") */
  developerSlug: string;
  /** Base URL of the developer's site */
  baseUrl: string;
  /** Whether authentication is required */
  authRequired: boolean;
  /** Rate limit: minimum ms between requests */
  rateLimitMs: number;
  /** Maximum retries on failure */
  maxRetries: number;
}

export interface RawUnit {
  sourceId: string;
  projectName: string;
  buildingName?: string;
  unitNumber?: string;
  floor?: number;
  rooms?: number;
  areaSqm?: number;
  livingAreaSqm?: number;
  finish?: string;
  priceRub?: number;
  pricePerSqm?: number;
  salesStatus?: "available" | "reserved" | "sold" | "blocked" | "unknown";
  sourceUrl?: string;
  fetchedAt: Date;
  raw?: Record<string, unknown>;
}

export interface RawProject {
  name: string;
  address?: string;
  district?: string;
  metro?: string[];
  latitude?: number;
  longitude?: number;
  projectClass?: string;
  status?: string;
  completionDate?: string;
  officialUrl?: string;
  priceRange?: { min?: number; max?: number };
}

export interface CollectorResult {
  developer: string;
  projects: RawProject[];
  units: RawUnit[];
  errors: string[];
  fetchedAt: Date;
  durationMs: number;
}

export interface DeveloperCollector {
  readonly config: CollectorConfig;

  /** Check if the source is accessible and responding */
  healthCheck(): Promise<boolean>;

  /** Fetch project list from the developer */
  fetchProjects(): Promise<RawProject[]>;

  /** Fetch unit-level data for a specific project */
  fetchUnits(projectSlug: string): Promise<RawUnit[]>;

  /** Run full collection cycle */
  collect(): Promise<CollectorResult>;
}
