export interface Locatie {
  id: string;
  naam: string;
  type: string;
  extra_checkin?: boolean;
  plaats: string;
  adres: string;
  contact_persoon?: string;
  telefoonnummer?: string;
  perceel: string;
}
