import fs from "node:fs/promises";
import { config } from "../config.js";

let normalizedDatasetCache = null;

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsv(rawCsv) {
  const lines = rawCsv.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((record, header, index) => {
      record[header] = values[index] ?? "";
      return record;
    }, {});
  });
}

function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function cleanValue(value, fallback = "Unknown") {
  if (!value || value === "NA") {
    return fallback;
  }

  return value;
}

function normalizeCorsairRecord(record) {
  return {
    id: `corsair_${record.attack_id}`,
    sourceDataset: "CORSAIR",
    sourceRecordId: record.attack_id,
    incidentDate: cleanValue(record.datetime),
    incidentRegion: cleanValue(record.basin),
    incidentType: cleanValue(record.attack_type),
    vesselType: cleanValue(record.vessel_type),
    latitude: asNumber(record.lat),
    longitude: asNumber(record.lon),
    narrative: cleanValue(record.narrative, ""),
    sourceSpecific: {
      crewInjured: asNumber(record.crew_injured) ?? 0,
      hostagesTaken: asNumber(record.hostages_taken) ?? 0,
      weapons: cleanValue(record.weapons),
      year: asNumber(record.year),
      month: asNumber(record.month)
    }
  };
}

function normalizeGlobalMaritimeRecord(record, index) {
  const sourceRecordId = `${record.date}_${record.vessel_name || "unknown"}_${index}`;

  return {
    id: `globalmaritime_${sourceRecordId}`,
    sourceDataset: "GlobalMaritime",
    sourceRecordId,
    incidentDate: cleanValue(record.date),
    incidentRegion: cleanValue(record.location_description),
    incidentType: cleanValue(record.attack_type),
    vesselType: cleanValue(record.vessel_type),
    latitude: asNumber(record.latitude),
    longitude: asNumber(record.longitude),
    narrative: cleanValue(record.attack_description, ""),
    sourceSpecific: {
      nearestCountry: cleanValue(record.nearest_country),
      eezCountry: cleanValue(record.eez_country),
      vesselStatus: cleanValue(record.vessel_status),
      dataSource: cleanValue(record.data_source),
      shoreDistance: asNumber(record.shore_distance)
    }
  };
}

function deriveScenarioMetadata(record) {
  const objectives = ["Build public trust", "Preserve freedom of navigation"];
  const risks = ["Perceived militarization", "Narrative exploitation by adversaries"];

  if (record.sourceDataset === "CORSAIR" && record.sourceSpecific.hostagesTaken > 0) {
    objectives.push("Protect hostage safety communications");
    risks.push("Escalation pressure from hostage timeline");
  }

  if (
    record.sourceDataset === "GlobalMaritime" &&
    record.sourceSpecific.shoreDistance !== null &&
    record.sourceSpecific.shoreDistance < 20
  ) {
    risks.push("Sovereignty sensitivity near coastline");
  }

  return { objectives, risks };
}

function toScenario(record) {
  const { objectives, risks } = deriveScenarioMetadata(record);
  const titleRegion = record.incidentRegion !== "Unknown" ? record.incidentRegion : "Maritime Zone";
  const titleType = record.incidentType !== "Unknown" ? record.incidentType : "Maritime Incident";

  return {
    id: `scenario_${record.id}`,
    title: `${titleType} near ${titleRegion}`,
    description: record.narrative || "Maritime security incident requiring public affairs response.",
    scenarioSourceType: "dataset_generated",
    sourceDataset: record.sourceDataset,
    sourceRecordIds: [record.sourceRecordId],
    sourceMetadata: {
      incidentDate: record.incidentDate,
      incidentRegion: record.incidentRegion,
      incidentType: record.incidentType,
      vesselType: record.vesselType,
      confidenceNote: `Normalized from ${record.sourceDataset} source fields.`,
      sourceSpecific: record.sourceSpecific
    },
    region: record.incidentRegion,
    objectives,
    risks,
    stakeholders: ["Local civilians", "Regional partners", "Maritime operators"],
    tags: ["piracy", "maritime-security", record.sourceDataset.toLowerCase()],
    difficulty: "medium"
  };
}

async function loadAndNormalizeDatasets() {
  const [corsairRaw, globalMaritimeRaw] = await Promise.all([
    fs.readFile(config.corsairDatasetPath, "utf8"),
    fs.readFile(config.globalMaritimeDatasetPath, "utf8")
  ]);

  const corsairRecords = parseCsv(corsairRaw).map(normalizeCorsairRecord);
  const globalMaritimeRecords = parseCsv(globalMaritimeRaw).map(normalizeGlobalMaritimeRecord);

  return [...corsairRecords, ...globalMaritimeRecords];
}

async function getNormalizedDataset() {
  if (!normalizedDatasetCache) {
    normalizedDatasetCache = await loadAndNormalizeDatasets();
  }

  return normalizedDatasetCache;
}

export async function listScenarios(filters = {}) {
  const normalizedRecords = await getNormalizedDataset();
  const { dataset, region, incidentType, limit = 20 } = filters;

  const normalizedDatasetFilter = dataset?.toLowerCase();
  const normalizedRegionFilter = region?.toLowerCase();
  const normalizedTypeFilter = incidentType?.toLowerCase();

  const filtered = normalizedRecords.filter((record) => {
    if (
      normalizedDatasetFilter &&
      record.sourceDataset.toLowerCase() !== normalizedDatasetFilter
    ) {
      return false;
    }

    if (
      normalizedRegionFilter &&
      !record.incidentRegion.toLowerCase().includes(normalizedRegionFilter)
    ) {
      return false;
    }

    if (
      normalizedTypeFilter &&
      !record.incidentType.toLowerCase().includes(normalizedTypeFilter)
    ) {
      return false;
    }

    return true;
  });

  const maxLimit = Math.min(Number(limit) || 20, 100);
  return filtered.slice(0, maxLimit).map(toScenario);
}

export async function getScenarioById(scenarioId) {
  if (!scenarioId) {
    return null;
  }

  const normalizedRecords = await getNormalizedDataset();
  const matched = normalizedRecords.find((record) => `scenario_${record.id}` === scenarioId);
  return matched ? toScenario(matched) : null;
}

