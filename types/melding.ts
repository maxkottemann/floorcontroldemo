export interface melding {
  id: string;
  profielnaam: string;
  kamervloer_id: string;
  kamervloer_naam: string;
  titel: string;
  beschrijving: string;
  afgehandeld: boolean;
  aangemaakt_op: string;
  uitleg?: string;
}
