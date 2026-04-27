import * as React from "react";

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export interface VloerscanReminderEmailProps {
  scanNaam: string;
  beschrijving?: string;
  startDatum: string;
  eindDatum?: string;
  locatieNaam: string;
  locatieAdres?: string;
  locatieplaats?: string;
  medewerkerNaam?: string;
  dagen: number;
  extraCheckin?: boolean;
}

export const VloerscanReminderEmail = ({
  scanNaam,
  beschrijving,
  startDatum,
  eindDatum,
  locatieNaam,
  locatieAdres,
  locatieplaats,
  medewerkerNaam,
  dagen,
  extraCheckin,
}: VloerscanReminderEmailProps) => (
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
          src="https://rso-floortcontrol.nl/duofortlogo.png"
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
          Vloerscan · start over {dagen} {dagen === 1 ? "dag" : "dagen"}
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
          {scanNaam}
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
            margin: "0",
            lineHeight: "1.5",
          }}
        >
          Dit is een herinnering dat onderstaande vloerscan over {dagen}{" "}
          {dagen === 1 ? "dag" : "dagen"} plaatsvindt op uw locatie.
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
        {/* Locatie + Datum */}
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
                  <p
                    style={{ fontSize: "12px", color: "#94a3b8", margin: "0" }}
                  >
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
                  Datum
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
                {eindDatum && eindDatum !== startDatum ? (
                  <p
                    style={{ fontSize: "12px", color: "#94a3b8", margin: "0" }}
                  >
                    t/m {formatDate(eindDatum)}
                  </p>
                ) : (
                  <p
                    style={{ fontSize: "12px", color: "#94a3b8", margin: "0" }}
                  >
                    Één dag
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

        {/* Medewerker */}
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
          Medewerker
        </p>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            backgroundColor: "#f8fafc",
            marginBottom: "28px",
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: "16px 18px" }}>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#81378e",
                    marginRight: "8px",
                  }}
                >
                  ●
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#0f172a",
                  }}
                >
                  {medewerkerNaam ?? "Nog niet toegewezen"}
                </span>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    margin: "8px 0 0 0",
                    lineHeight: "1.6",
                  }}
                >
                  {medewerkerNaam
                    ? medewerkerNaam +
                      " komt op " +
                      formatDate(startDatum) +
                      " naar uw locatie om de vloeren te inspecteren en de staat van alle vloerbekleding te beoordelen."
                    : "Er is nog geen medewerker toegewezen aan deze vloerscan. U ontvangt hier bericht over."}
                </p>
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

        {/* Wat kunt u verwachten */}
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
          Wat kunt u verwachten
        </p>

        {[
          {
            dot: "①",
            text: "Onze medewerker meldt zich bij aankomst bij de receptie of verantwoordelijke.",
          },
          {
            dot: "②",
            text: "Alle vloeren worden visueel geïnspecteerd op slijtage, beschadigingen en staat van onderhoud.",
          },
          {
            dot: "③",
            text: "De bevindingen worden digitaal vastgelegd in het FloorControl systeem.",
          },
          {
            dot: "④",
            text: "Na afloop ontvangt u een overzicht van de scanresultaten via het portaal.",
          },
        ].map(({ dot, text }, i) => (
          <table
            key={i}
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "10px",
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    width: "32px",
                    verticalAlign: "top",
                    paddingTop: "1px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "16px",
                      color: "#81378e",
                      fontWeight: "700",
                    }}
                  >
                    {dot}
                  </span>
                </td>
                <td
                  style={{
                    fontSize: "13px",
                    color: "#334155",
                    lineHeight: "1.6",
                    paddingLeft: "8px",
                  }}
                >
                  {text}
                </td>
              </tr>
            </tbody>
          </table>
        ))}

        {/* Extra check-in */}
        {extraCheckin && (
          <div
            style={{
              backgroundColor: "#fffbeb",
              borderRadius: "10px",
              padding: "14px 18px",
              border: "1px solid #fde68a",
              marginTop: "24px",
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
              Let op — Aanmeldprocedure vereist
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "#92400e",
                margin: "0",
                lineHeight: "1.6",
              }}
            >
              Voor deze locatie is een extra aanmeldprocedure van kracht. Onze
              medewerker dient zich bij aankomst eerst te melden bij de receptie
              of beveiligingsdienst voordat de locatie betreden mag worden.
            </p>
          </div>
        )}

        <div
          style={{
            height: "1px",
            backgroundColor: "#f1f5f9",
            margin: "28px 0",
          }}
        />

        <p
          style={{
            fontSize: "13px",
            color: "#94a3b8",
            lineHeight: "1.7",
            margin: "0",
          }}
        >
          {"Heeft u vragen over deze vloerscan? Neem dan contact op via "}
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
          {"."}
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
