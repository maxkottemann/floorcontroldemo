export interface OnderhoudsAanvraag {
  id: string;
  locatie_id: string;
  locatie_naam: string;
  profiel_id: string;
  profiel_naam: string;
  naam: string;
  beschrijving: string;
  opmerkingen: string;
  afgehandeld: boolean;
  aangemaakt_op: string;
}
