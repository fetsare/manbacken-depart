"use server";

import {
  type Station,
  type ProcessedDeparture,
  type ApiDeparture,
} from "@/lib/types";
import { formatTimeDifference, removeParentheses } from "@/lib/utils";
import {
  RESROBOT_API_BASE_URL,
  RESROBOT_ACCESS_ID,
  API_DURATION,
  DEFAULT_MIN_TIME_THRESHOLD,
  MAX_DEPARTURES_TO_DISPLAY,
  validateConfig,
} from "@/lib/constants";
import { promises as fs } from "fs";
import path from "path";

interface StationWithDepartures {
  station: Station;
  departures: ApiDeparture[];
}

export async function fetchDepartures(
  configName: string,
): Promise<StationWithDepartures[]> {
  let stations: Station[];

  console.log(`[fetchDepartures] Loading config: ${configName}`);

  try {
    const configPath = path.join(
      process.cwd(),
      "lib",
      "configs",
      `${configName}.json`,
    );
    console.log(`Reading config from: ${configPath}`);
    const fileContents = await fs.readFile(configPath, "utf8");
    const data = JSON.parse(fileContents);
    stations = data.stations;
    console.log(`Loaded ${stations.length} stations from ${configName}`);
  } catch (error) {
    console.error(`Failed to load config ${configName}:`, error);
    throw new Error(`Failed to load config: ${configName}`);
  }
  validateConfig();

  const allResults = await Promise.all(
    stations.map(async (station) => {
      try {
        const response = await fetch(
          `${RESROBOT_API_BASE_URL}?id=${station.id}&format=json&accessId=${RESROBOT_ACCESS_ID}&duration=${API_DURATION}&passlist=1`, // passlist=1 is used to get all stops after the station
          {
            next: { revalidate: 600 },
          },
        );
        if (!response.ok) {
          console.error(
            `Failed to fetch departures for station ${station.name}`,
          );
          return { station, departures: [] };
        }

        const data = await response.json();
        const departures: ApiDeparture[] = data.Departure || [];

        return { station, departures };
      } catch (stationError) {
        console.error(`Error fetching departures for station ${station.id}`);
        return { station, departures: [] };
      }
    }),
  );

  return allResults;
}

export function processDepartures(
  stationsWithDepartures: StationWithDepartures[],
): ProcessedDeparture[] {
  const processedDeparturesPerStation = stationsWithDepartures.map(
    ({ station, departures }) => {
      const stationName = station.name;
      const departureConfigMap = new Map(
        station.departures.map((d) => [d.line, d]),
      );

      const processedDepartures = departures
        .map((departure) => {
          const timeWithoutSeconds = departure.time
            .split(":")
            .slice(0, 2)
            .join(":");
          const timeDifference = formatTimeDifference(departure.time);

          const lineNumber = departure.ProductAtStop?.line || "Unknown";
          const catOutL = departure.ProductAtStop?.catOutL || "";

          const transportTypeMatch = catOutL.match(
            /\b(Buss|Tunnelbana|Tåg|Spårväg)\b/i,
          );
          const transportType = transportTypeMatch
            ? transportTypeMatch[1]
            : "Unknown";

          const config = departureConfigMap.get(lineNumber);

          let arrivalTime: string | undefined;
          let journeyDuration: number | undefined;
          if (departure.Stops?.Stop && departure.Stops.Stop.length > 0) {
            const lastStop =
              departure.Stops.Stop[departure.Stops.Stop.length - 1]; // get the last stop
            if (lastStop.arrTime) {
              arrivalTime = lastStop.arrTime.split(":").slice(0, 2).join(":"); // remove seconds in hh:mm:ss format from the api
              const depTime = formatTimeDifference(departure.time);
              const arrTime = formatTimeDifference(lastStop.arrTime);
              if (typeof depTime === "number" && typeof arrTime === "number") {
                journeyDuration = arrTime - depTime;
              }
            }
          }

          return {
            name: lineNumber,
            transportType: transportType,
            time: timeWithoutSeconds,
            timeLeft: timeDifference,
            direction: removeParentheses(departure.direction),
            station: stationName,
            tunnelbanaColor: config?.tunnelbanaColor,
            arrivalTime,
            journeyDuration,
          };
        })
        .filter((departure) => {
          const config = departureConfigMap.get(departure.name);

          if (!config) {
            console.log(
              `Line ${departure.name} not in config for station ${stationName}`,
            );
            return false;
          }

          if (
            departure.time === "Departed" ||
            departure.name === "Unknown" ||
            typeof departure.timeLeft !== "number"
          ) {
            return false;
          }

          const minTimeThreshold =
            config.minTimeThreshold ?? DEFAULT_MIN_TIME_THRESHOLD;
          if (departure.timeLeft <= minTimeThreshold) return false;

          if (config.directions) {
            const directionMatches = config.directions.some((filter) =>
              departure.direction.toLowerCase().includes(filter.toLowerCase()),
            );
            if (!directionMatches) return false;
          }

          return true;
        });

      return processedDepartures;
    },
  );

  const newBusses: ProcessedDeparture[] = [];
  const newTrains: ProcessedDeparture[] = [];

  processedDeparturesPerStation.flat().forEach((result) => {
    switch (result.transportType) {
      case "Buss":
        newBusses.push(result);
        break;
      default:
        newTrains.push(result);
    }
  });

  const allDepartures = [...newBusses, ...newTrains].sort(
    (a, b) => (a.timeLeft as number) - (b.timeLeft as number),
  );

  const departuresByLineAndDirection = new Map<string, ProcessedDeparture[]>();
  allDepartures.forEach((dep) => {
    const key = `${dep.name}|${dep.direction}`;
    const existing = departuresByLineAndDirection.get(key) || [];
    existing.push(dep);
    departuresByLineAndDirection.set(key, existing);
  });

  const departuresWithNext = allDepartures.map((dep) => {
    const key = `${dep.name}|${dep.direction}`;
    const sameLine = departuresByLineAndDirection.get(key) || [];
    const currentIndex = sameLine.findIndex(
      (d) => d.time === dep.time && d.station === dep.station,
    );
    const nextDep = sameLine[currentIndex + 1];

    let nextDepartureTimeLeft: number | undefined = undefined;
    if (nextDep && typeof nextDep.timeLeft === "number") {
      nextDepartureTimeLeft = nextDep.timeLeft;
    }

    return {
      ...dep,
      nextDepartureTimeLeft,
    };
  });

  return departuresWithNext.slice(0, MAX_DEPARTURES_TO_DISPLAY);
}

export async function getDepartures(configName: string) {
  const rawDepartures = await fetchDepartures(configName);
  return processDepartures(rawDepartures);
}
