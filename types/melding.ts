export interface melding {
  id: string;
  profielnaam: string;
  kamervloer_id: string;
  kamervloer_naam?: string;
  vierkante_meter?: number;
  titel: string;
  beschrijving: string;
  afgehandeld: boolean;
  aangemaakt_op: string;
  uitleg?: string;
}
