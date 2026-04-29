import * as React from "react";

export interface VloerRegel {
  naam: string;
  m2: number;
}

export interface BusRegel {
  naam: string;
  kenteken: string;
  crew: string[];
}

export interface ProjectReminderEmailProps {
  projectNaam: string;
  startDatum: string;
  eindDatum?: string;
  locatieNaam: string;
  locatieAdres?: string;
  locatieplaats?: string;
  contactNaam?: string;
  beschrijving?: string;
  opmerking?: string;
  vloertypes: VloerRegel[];
  bussen: BusRegel[];
  totaalM2: number;
  dagen: number; // ← add this
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const ProjectReminderEmail = ({
  projectNaam,
  startDatum,
  eindDatum,
  locatieNaam,
  locatieAdres,
  locatieplaats,
  contactNaam,
  beschrijving,
  opmerking,
  vloertypes,
  bussen,
  totaalM2,
  dagen,
}: ProjectReminderEmailProps) => (
  <div
    style={{
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      backgroundColor: "#f4f6f9",
      padding: "32px 0",
    }}
  >
    <style>{`
      @media only screen and (max-width: 600px) {
        .outer  { padding: 0 !important; }
        .card   { padding: 24px 20px !important; }
        .detail-table { border-spacing: 0 !important; }
        .detail-td {
          display: block !important;
          width: 100% !important;
          box-sizing: border-box !important;
          margin-bottom: 10px !important;
        }
        .h1 { font-size: 20px !important; }
        .footer-right { display: none !important; }
      }
    `}</style>

    <div
      className="outer"
      style={{ maxWidth: "580px", margin: "0 auto", padding: "0 12px" }}
    >
      {/* Header */}
      <div
        className="card"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px 16px 0 0",
          padding: "32px 40px 28px",
          borderBottom: "3px solid #81378e",
        }}
      >
        <img
          src="https://floorcontroldemo.vercel.app/floorcontrol.png"
          alt="Duofort"
          height="40"
          style={{ display: "block", marginBottom: "24px" }}
        />
        <p
          style={{
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#81378e",
            margin: "0 0 8px 0",
          }}
        >
          Herinnering · start over {dagen} {dagen === 1 ? "dag" : "dagen"}
        </p>
        <h1
          className="h1"
          style={{
            fontSize: "24px",
            fontWeight: "800",
            color: "#0f172a",
            margin: "0 0 8px 0",
            lineHeight: "1.2",
          }}
        >
          {projectNaam}
        </h1>
        {beschrijving && (
          <p
            style={{
              fontSize: "14px",
              color: "#334155",
              margin: "0 0 8px 0",
              lineHeight: "1.5",
              fontWeight: "500",
            }}
          >
            {beschrijving}
          </p>
        )}
        <p
          style={{
            fontSize: "14px",
            color: "#94a3b8",
            margin: 0,
            lineHeight: "1.5",
          }}
        >
          Dit is een herinnering dat onderstaand project over {dagen}{" "}
          {dagen === 1 ? "dag" : "dagen"} van start gaat.
        </p>
      </div>

      {/* Body */}
      <div
        className="card"
        style={{
          backgroundColor: "#ffffff",
          padding: "32px 40px",
          borderTop: "1px solid #81378e",
        }}
      >
        {/* Locatie + Periode */}
        <table
          className="detail-table"
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: "12px 0",
            marginBottom: "24px",
          }}
        >
          <tbody>
            <tr>
              <td
                className="detail-td"
                style={{
                  width: "50%",
                  backgroundColor: "#f8fafc",
                  borderRadius: "12px",
                  padding: "16px 18px",
                  verticalAlign: "top",
                  border: "1px solid #e2e8f0",
                }}
              >
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#94a3b8",
                    margin: "0 0 6px 0",
                  }}
                >
                  Locatie
                </p>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#0f172a",
                    margin: "0 0 3px 0",
                  }}
                >
                  {locatieNaam}
                </p>
                {locatieAdres && (
                  <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                    {locatieAdres}
                    {locatieplaats ? `, ${locatieplaats}` : ""}
                  </p>
                )}
              </td>
              <td
                className="detail-td"
                style={{
                  width: "50%",
                  backgroundColor: "#f8fafc",
                  borderRadius: "12px",
                  padding: "16px 18px",
                  verticalAlign: "top",
                  border: "1px solid #e2e8f0",
                }}
              >
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#94a3b8",
                    margin: "0 0 6px 0",
                  }}
                >
                  Periode
                </p>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#0f172a",
                    margin: "0 0 3px 0",
                  }}
                >
                  {formatDate(startDatum)}
                </p>
                {eindDatum && (
                  <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                    t/m {formatDate(eindDatum)}
                  </p>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        <div
          style={{
            height: "1px",
            backgroundColor: "#f1f5f9",
            margin: "0 0 28px 0",
          }}
        />

        {/* Vloertypes */}
        <p
          style={{
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#94a3b8",
            margin: "0 0 16px 0",
          }}
        >
          Uit te voeren werkzaamheden
        </p>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "16px",
          }}
        >
          <thead>
            <tr>
              <td
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#cbd5e1",
                  padding: "0 0 10px 0",
                }}
              >
                Vloertype
              </td>
              <td
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#cbd5e1",
                  padding: "0 0 10px 0",
                  textAlign: "right",
                }}
              >
                Oppervlak
              </td>
            </tr>
          </thead>
          <tbody>
            {vloertypes.map((vt, i) => (
              <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                <td style={{ padding: "12px 0", verticalAlign: "middle" }}>
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#81378e",
                      marginRight: "8px",
                    }}
                  >
                    ●
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#334155",
                      fontWeight: "500",
                    }}
                  >
                    {vt.naam}
                  </span>
                </td>
                <td
                  style={{
                    padding: "12px 0",
                    textAlign: "right",
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#0f172a",
                    verticalAlign: "middle",
                    whiteSpace: "nowrap",
                  }}
                >
                  {vt.m2.toFixed(0)} m²
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaal */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "#f8fafc",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            marginBottom: "28px",
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  padding: "14px 18px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#64748b",
                }}
              >
                Totaal oppervlak
              </td>
              <td
                style={{
                  padding: "14px 18px",
                  fontSize: "18px",
                  fontWeight: "800",
                  color: "#0f172a",
                  textAlign: "right",
                  whiteSpace: "nowrap",
                }}
              >
                {totaalM2.toFixed(0)}{" "}
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#94a3b8",
                  }}
                >
                  m²
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          style={{
            height: "1px",
            backgroundColor: "#f1f5f9",
            margin: "0 0 28px 0",
          }}
        />

        {/* Bussen */}
        <p
          style={{
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#94a3b8",
            margin: "0 0 16px 0",
          }}
        >
          Ingeplande bussen & medewerkers
        </p>

        {bussen.map((bus, i) => (
          <table
            key={i}
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              marginBottom: "12px",
              backgroundColor: "#f8fafc",
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    padding: "14px 18px",
                    borderBottom:
                      bus.crew.length > 0 ? "1px solid #f1f5f9" : "none",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "700",
                      color: "#0f172a",
                      marginRight: "10px",
                    }}
                  >
                    {bus.naam}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#ffffff",
                      backgroundColor: "#81378e",
                      borderRadius: "4px",
                      padding: "2px 8px",
                      fontFamily: "monospace",
                    }}
                  >
                    {bus.kenteken}
                  </span>
                </td>
              </tr>
              {bus.crew.length > 0 ? (
                bus.crew.map((naam, j) => (
                  <tr key={j}>
                    <td
                      style={{
                        padding: "9px 18px",
                        fontSize: "13px",
                        color: "#334155",
                        borderTop: j === 0 ? "none" : "1px solid #f1f5f9",
                      }}
                    >
                      <span style={{ color: "#81378e", marginRight: "8px" }}>
                        ●
                      </span>
                      {naam}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    style={{
                      padding: "9px 18px",
                      fontSize: "13px",
                      color: "#94a3b8",
                    }}
                  >
                    Nog geen medewerkers toegewezen
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ))}

        <div
          style={{
            height: "1px",
            backgroundColor: "#f1f5f9",
            margin: "28px 0",
          }}
        />

        {opmerking && (
          <div
            style={{
              backgroundColor: "#fffbeb",
              borderRadius: "10px",
              padding: "14px 18px",
              border: "1px solid #fde68a",
              marginBottom: "28px",
            }}
          >
            <p
              style={{
                fontSize: "10px",
                fontWeight: "700",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#d97706",
                margin: "0 0 6px 0",
              }}
            >
              Opmerking
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "#92400e",
                margin: 0,
                lineHeight: "1.6",
              }}
            >
              {opmerking}
            </p>
          </div>
        )}

        <p
          style={{
            fontSize: "13px",
            color: "#94a3b8",
            lineHeight: "1.7",
            margin: 0,
          }}
        >
          Heeft u vragen over dit project? Neem dan contact op via{" "}
          <a
            href="mailto:info@duofort.nl"
            style={{
              color: "#3AB8BF",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            info@duofort.nl
          </a>
          .
        </p>
      </div>

      {/* Footer */}
      <div
        className="card"
        style={{
          backgroundColor: "#f8fafc",
          padding: "20px 40px",
          borderRadius: "0 0 16px 16px",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ fontSize: "11px", color: "#cbd5e1" }}>
                Duofort B.V. · FloorControl
              </td>
              <td
                className="footer-right"
                style={{
                  fontSize: "11px",
                  color: "#cbd5e1",
                  textAlign: "right",
                }}
              >
                Automatisch bericht — niet beantwoorden
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
