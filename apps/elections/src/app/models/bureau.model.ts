export interface BureauDeVote {
  id: string;
  idInsee: string;
  codeCommune: string;
  code: string;
  libelle: string;
  numVoie: string;
  voie: string;
  codePostal: string;
  commune: string;
  nbAdressesInitial: number;
  nbAdressesFinal: number;
  idMiom: string;
}

export interface Commune {
  codeCommune: string;
  name: string;
  codePostal: string;
  departmentCode: string;
  departmentName: string;
  region: string;
  bureauCount: number;
}

export interface CandidateResult {
  votes: number;
}
