export interface Steekproef {
  id: string;
  project_id: string;
  project_naam: string;
  locatie_naam: string;
  locatie_plaats: string | null;
  status: string;
  aangemaakt_op: string;
  afgerond_op: string | null;
  afgerond_door: string | null;
}
