export function parseCAP(capXml) {
    if (typeof XMLParser === "undefined") {
      console.error("XMLParser is not available. Make sure fast-xml-parser is loaded in index.html.");
      return [];
    }
  
    const parser = new XMLParser();
    const json = parser.parse(capXml);
    const entries = json.feed?.entry || [];
  
    return entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      summary: entry.summary,
      updated: entry.updated,
      link: entry.link?.["@_href"],
      polygon: entry["cap:polygon"],
      areaDesc: entry["cap:areaDesc"],
      effective: entry["cap:effective"],
      expires: entry["cap:expires"],
      event: entry["cap:event"],
      urgency: entry["cap:urgency"],
      severity: entry["cap:severity"],
      certainty: entry["cap:certainty"],
    }));
  }