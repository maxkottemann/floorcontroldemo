import { VraagBericht } from "./vraagbericht";

export interface VraagThread {
  id: string;
  berichten: VraagBericht[];
  profiel_id: string;
  profiel_naam: string;
  onderwerp: string;
  aangemaakt_op: string;
  ongelezen: number;
}
