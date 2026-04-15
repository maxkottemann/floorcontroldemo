import { bus } from "./bus";

export interface project {
  id: string;
  locatie_naam: string;
  naam: string;
  beschrijving?: string;
  opmerkingen?: string;
  aangemaakt_op?: string;
  start_datum?: string;
  eind_datum?: string;
  bus?: bus[];
  status?: string;
}
