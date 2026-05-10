import { VraagThread } from "./vraagthread";

export interface VraagBericht {
  id: string;
  thread: VraagThread;
  profiel_id: string;
  profiel_naam: string;
  bericht: string;
  gelezen: boolean;
  aangemaakt_op: string;
}
