export interface SwimmerSummary {
  id: string
  name: string
  species: string
  distanceTraveled: number
  baseSpeedPerHour: number
  lastUpdateTimestampMs: number
}

export interface TunaCanItem {
  id: string
  energy: number
}
