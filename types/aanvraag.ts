export interface aanvraag {
  id: string;
  email: string;
  goedgekeurd: boolean;
  naam: string;
  rol: string;
  locaties: string[];
  stap: string;
  aangemaakt_op: string;
}
