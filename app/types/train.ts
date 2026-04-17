export interface Train {
  currentX: number;
  currentY: number;
  trainId: string;
  timeStamp: number;
  line: Line;
  lineOrigin: Station;
  lineDestination: Station;
  departureTime: number;
  arrivalTime: number;
  lastLeavingStation: Station;
  nextPendingStation: Station;
  lineString: LineString;
  
}

export interface Line {
  name: string;
}

export interface Station {
  stationName: string;
  xCoordinate: number;
  yCoordinate: number;
  departureTime: number;
  arrivalTime: number;
}

export interface LineString {
  points: Point[]
}

export interface Point {
  x: number;
  y: number;
}