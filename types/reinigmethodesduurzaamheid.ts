export interface reinigmethode {
  reinigmethode_id: string;
  reinigmethode_naam: string;
  waterverbruik: number;
  afvalwater: number;
  chemieverbruik: number;
  verpakking?: number;
  stroomverbruik: number;
  waterverbruik_old: number;
  afvalwater_old: number;
  chemievebruik_old: number;
  stroom_old: number;
  vierkante_meter?: number;
  verpakking_old?: number;
}
