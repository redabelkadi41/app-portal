import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface ApiCandidate {
  id: number;
  name: string;
  sort_order: number;
}

export interface BureauVoteData {
  votes: Record<number, number>;
  blancs: number;
  nuls: number;
  version: number;
}

@Injectable({ providedIn: 'root' })
export class ElectionApiService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly apiBase = '/elections/api';

  // --- Candidates ---

  async getCandidates(): Promise<ApiCandidate[]> {
    return this.get<ApiCandidate[]>('/candidates');
  }

  async createCandidate(name: string, sortOrder: number): Promise<ApiCandidate> {
    return this.post<ApiCandidate>('/candidates', { name, sort_order: sortOrder });
  }

  async updateCandidate(id: number, data: { name?: string; sort_order?: number }): Promise<void> {
    await this.put(`/candidates/${id}`, data);
  }

  async deleteCandidate(id: number): Promise<void> {
    await this.del(`/candidates/${id}`);
  }

  async reorderCandidates(orderedIds: number[]): Promise<void> {
    await this.put('/candidates/reorder', { order: orderedIds });
  }

  // --- Votes ---

  async getBureauVotes(bureauId: string): Promise<BureauVoteData> {
    return this.get<BureauVoteData>(`/votes/bureau/${encodeURIComponent(bureauId)}`);
  }

  async getBulkVotes(bureauIds: string[]): Promise<Record<string, BureauVoteData>> {
    if (bureauIds.length === 0) return {};
    const ids = bureauIds.map(id => encodeURIComponent(id)).join(',');
    return this.get<Record<string, BureauVoteData>>(`/votes/bulk?ids=${ids}`);
  }

  async saveBureauVotes(
    bureauId: string,
    data: { votes: Record<number, number>; blancs: number; nuls: number; version: number }
  ): Promise<{ version: number }> {
    return this.put<{ version: number }>(`/votes/bureau/${encodeURIComponent(bureauId)}`, data);
  }

  // --- HTTP helpers ---

  private async get<T>(path: string): Promise<T> {
    if (!this.isBrowser) return {} as T;
    const res = await fetch(this.apiBase + path);
    if (!res.ok) throw await this.toError(res);
    return res.json();
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    if (!this.isBrowser) return {} as T;
    const res = await fetch(this.apiBase + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw await this.toError(res);
    return res.json();
  }

  private async put<T>(path: string, body: unknown): Promise<T> {
    if (!this.isBrowser) return {} as T;
    const res = await fetch(this.apiBase + path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw await this.toError(res);
    return res.json();
  }

  private async del(path: string): Promise<void> {
    if (!this.isBrowser) return;
    const res = await fetch(this.apiBase + path, { method: 'DELETE' });
    if (!res.ok) throw await this.toError(res);
  }

  private async toError(res: globalThis.Response): Promise<Error> {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error ?? `HTTP ${res.status}`;
    const err = new Error(msg);
    (err as any).status = res.status;
    return err;
  }
}
