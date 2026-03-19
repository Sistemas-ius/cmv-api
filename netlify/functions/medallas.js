exports.handler = async function(event, context) {
  const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQB7y09xM__-pv1Ry_CeJoEoTJZ-YFe4J_pjrByHjf90zxLkS_trgtafHgq_dxXcg/pub?gid=804291505&single=true&output=csv";

  try {
    const response = await fetch(SHEET_URL);
    if (!response.ok) throw new Error("HTTP " + response.status);
    const csv = await response.text();

    const lines = csv.trim().split("\n");

    // Buscar fila con encabezados reales (contiene "Concurso" y "Medalla")
    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("Concurso") && lines[i].includes("Medalla")) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) throw new Error("No se encontraron encabezados");

    const headers = lines[headerIndex]
      .split(",")
      .map(h => h.trim().replace(/^"|"$/g, ""));

    const rows = lines.slice(headerIndex + 1)
      .filter(line => line.trim())
      .map(line => {
        const vals = [];
        let cur = "", inQ = false;
        for (const ch of line) {
          if (ch === '"') { inQ = !inQ; }
          else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ""; }
          else { cur += ch; }
        }
        vals.push(cur.trim());
        return Object.fromEntries(
          headers.map((h, i) => [h, (vals[i] || "").replace(/^"|"$/g, "")])
        );
      })
      .filter(r => r["Concurso"] && r["Medalla"]);

    return {
      statusCode: 200,
      headers: {
        "Content-Type":                 "application/json",
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "GET",
        "Cache-Control":                "public, max-age=300"
      },
      body: JSON.stringify(rows)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
