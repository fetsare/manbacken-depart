export interface DepartureConfig {
  line: string;
  directions?: string[];
  minTimeThreshold?: number;
  tunnelbanaColor?: "green" | "blue";
}

export interface Station {
  name: string;
  id: number;
  departures: DepartureConfig[];
}

export interface ProcessedDeparture {
  name: string;
  transportType: string;
  time: string;
  timeLeft: number | string;
  direction: string;
  station: string;
  nextDepartureTimeLeft?: number;
  tunnelbanaColor?: "green" | "blue";
  arrivalTime?: string;
  journeyDuration?: number;
}

export interface Stop {
  name: string;
  id: string;
  extId: string;
  routeIdx: number;
  lon: number;
  lat: number;
  depTime?: string;
  depDate?: string;
  arrTime?: string;
  arrDate?: string;
}

export interface ApiDeparture {
  name: string;
  time: string;
  direction: string;
  ProductAtStop?: {
    line: string;
    displayNumber: string;
    catOutL: string;
  };
  Stops?: {
    Stop: Stop[];
  };
}
