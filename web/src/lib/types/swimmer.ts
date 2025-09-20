export interface SwimmerSummary {
  id: string
  name: string
  species: string
  distanceTraveled: number
  baseSpeedPerHour: number
  lastUpdateTimestampMs: number
  swimCapColor?: {
    r: number
    g: number
    b: number
  }
}

export interface TunaCanItem {
  id: string
  energy: number
}
