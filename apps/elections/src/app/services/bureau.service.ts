import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BureauDeVote, Commune } from '../models/bureau.model';
import { getDepartmentCode, getDepartmentInfo } from '../data/departments';

function titleCase(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

@Injectable({ providedIn: 'root' })
export class BureauService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly bureauMap = new Map<string, BureauDeVote[]>();

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly communes = signal<Commune[]>([]);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadData();
    } else {
      this.loading.set(false);
    }
  }

  getBureaux(codeCommune: string): BureauDeVote[] {
    return this.bureauMap.get(codeCommune) ?? [];
  }

  private async loadData(): Promise<void> {
    try {
      const response = await fetch('assets/table-bv-reu.parquet');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = await response.arrayBuffer();
      const { parquetRead } = await import('hyparquet');

      await new Promise<void>((resolve, reject) => {
        try {
          parquetRead({
            file: buffer,
            onComplete: (data: unknown[][]) => {
              this.processData(data);
              resolve();
            },
          });
        } catch (e) {
          reject(e);
        }
      });

      this.loading.set(false);
    } catch {
      this.error.set('Erreur lors du chargement des données');
      this.loading.set(false);
    }
  }

  private processData(data: unknown[][]): void {
    const communeAgg = new Map<string, { name: string; cp: string; bureaux: BureauDeVote[] }>();

    for (const row of data) {
      const bureau: BureauDeVote = {
        id: row[0] as string,
        idInsee: row[1] as string,
        codeCommune: row[2] as string,
        code: row[3] as string,
        libelle: row[4] as string,
        numVoie: row[5] as string,
        voie: row[6] as string,
        codePostal: row[7] as string,
        commune: row[8] as string,
        nbAdressesInitial: row[9] as number,
        nbAdressesFinal: row[10] as number,
        idMiom: row[11] as string,
      };

      let entry = communeAgg.get(bureau.codeCommune);
      if (!entry) {
        entry = { name: bureau.commune, cp: bureau.codePostal, bureaux: [] };
        communeAgg.set(bureau.codeCommune, entry);
      }
      entry.bureaux.push(bureau);
    }

    const communes: Commune[] = [];

    for (const [code, agg] of communeAgg) {
      const depCode = getDepartmentCode(code);
      const dept = getDepartmentInfo(depCode);

      communes.push({
        codeCommune: code,
        name: titleCase(agg.name),
        codePostal: agg.cp,
        departmentCode: depCode,
        departmentName: dept?.name ?? depCode,
        region: dept?.region ?? 'Inconnue',
        bureauCount: agg.bureaux.length,
      });

      this.bureauMap.set(code, agg.bureaux);
    }

    communes.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    this.communes.set(communes);
  }
}
