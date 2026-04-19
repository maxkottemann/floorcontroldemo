import * as React from "react";

interface VloerType {
  naam: string;
  m2: number;
}

interface ProjectAangemaaktEmailProps {
  projectNaam: string;
  locatieNaam: string;
  locatieAdres?: string;
  startDatum: string;
  locatieplaats:string;
  eindDatum?: string;
  contactPersoon?: string;
  vloertypes: VloerType[];
  totaalM2: number;
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const ProjectAangemaaktEmail = ({
  projectNaam,
  locatieNaam,
  locatieAdres,
  locatieplaats,
  startDatum,
  eindDatum,
  contactPersoon,
  vloertypes,
  totaalM2,
}: ProjectAangemaaktEmailProps) => (
  <div style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", backgroundColor: "#f4f6f9", padding: "48px 0" }}>
    <div style={{ maxWidth: "580px", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "16px 16px 0 0", padding: "32px 40px 28px", borderBottom: "3px solid #3AB8BF" }}>
        <img
          src="https://floor-control.vercel.app/duofort.png"
          alt="Duofort"
          height="48"
          style={{ display: "block", marginBottom: "28px" }}
        />
        <p style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase", color: "#81378e", margin: "0 0 8px 0" }}>
          Nieuw project ingepland
        </p>
        <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: "0 0 8px 0", lineHeight: "1.2" }}>
          {projectNaam}
        </h1>
        <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0, lineHeight: "1.5" }}>
          Er is een nieuw project voor u ingepland. Hieronder vindt u alle details.
        </p>
      </div>

      <div style={{ backgroundColor: "#ffffff", padding: "32px 40px", borderTop: "1px solid #81378e" }}>

        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "12px 0", marginBottom: "32px" }}>
          <tr>
            <td style={{ width: "50%", backgroundColor: "#f8fafc", borderRadius: "12px", padding: "18px 20px", verticalAlign: "top", border: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 6px 0" }}>Locatie</p>
              <p style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", margin: "0 0 3px 0" }}>{locatieNaam}</p>
              {locatieAdres && <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>{locatieAdres}, {locatieplaats}</p>}
            </td>
            <td style={{ width: "50%", backgroundColor: "#f8fafc", borderRadius: "12px", padding: "18px 20px", verticalAlign: "top", border: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 6px 0" }}>Periode</p>
              <p style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", margin: "0 0 3px 0" }}>{formatDate(startDatum)}</p>
              {eindDatum && <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>t/m {formatDate(eindDatum)}</p>}
            </td>
          </tr>
        </table>

        {/* Divider */}
        <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "0 0 28px 0" }} />

        {/* Werkzaamheden */}
        <p style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 16px 0" }}>
          Uit te voeren werkzaamheden
        </p>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
          <thead>
            <tr>
              <td style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "#cbd5e1", padding: "0 0 10px 0" }}>Vloertype</td>
              <td style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "#cbd5e1", padding: "0 0 10px 0", textAlign: "right" }}>Oppervlak</td>
            </tr>
          </thead>
          <tbody>
            {vloertypes.map((vt, i) => (
              <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                <td style={{ padding: "13px 0", verticalAlign: "middle" }}>
                  <span style={{ fontSize: "14px", color: "#3AB8BF", marginRight: "8px" }}>●</span>
                  <span style={{ fontSize: "14px", color: "#334155", fontWeight: "500" }}>{vt.naam}</span>
                </td>
                <td style={{ padding: "13px 0", textAlign: "right", fontSize: "14px", fontWeight: "700", color: "#0f172a", verticalAlign: "middle" }}>
                  {vt.m2.toFixed(0)} m²
                </td>
              </tr>
            ))}
          </tbody>
        </table>

       <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "32px" }}>
  <tr>
    <td style={{ padding: "16px 20px", fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Totaal oppervlak</td>
    <td style={{ padding: "16px 20px", fontSize: "18px", fontWeight: "800", color: "#0f172a", textAlign: "right" }}>
      {totaalM2.toFixed(0)} <span style={{ fontSize: "13px", fontWeight: "600", color: "#94a3b8" }}>m²</span>
    </td>
  </tr>
</table>

        {/* Divider */}
        <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "0 0 28px 0" }} />

        {/* Contact */}
        {contactPersoon && (
          <div style={{ marginBottom: "28px" }}>
            <p style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 8px 0" }}>
              Uw contactpersoon
            </p>
            <p style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: 0 }}>{contactPersoon}</p>
          </div>
        )}

        <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: "1.7", margin: 0 }}>
          Heeft u vragen over dit project? Neem dan contact op via{" "}
          <a href="mailto:info@rso-floorcontrol.nl" style={{ color: "#3AB8BF", fontWeight: "600", textDecoration: "none" }}>
            info@duofort.nl
          </a>.
        </p>
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: "#f8fafc", padding: "20px 40px", borderRadius: "0 0 16px 16px", borderTop: "1px solid #e2e8f0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tr>
            <td style={{ fontSize: "11px", color: "#cbd5e1" }}>Duofort B.V. · FloorControl</td>
            <td style={{ fontSize: "11px", color: "#cbd5e1", textAlign: "right" }}>Automatisch bericht — niet beantwoorden</td>
          </tr>
        </table>
      </div>

    </div>
  </div>
);