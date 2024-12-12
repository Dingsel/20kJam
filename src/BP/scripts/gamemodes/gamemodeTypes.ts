import { Player, Vector3 } from "@minecraft/server"

export type GamemodeType = "Solo" | "Team"

export interface GamemodeExport {
    displayName: string
    typeId: string
    gamemodeType: GamemodeType
    gameSettings: GameSettingInformation

    spawnPlayer: (player: Player) => void

    onceActive?: () => void
    whileActive?: () => void
}

export type DeathSequenceType = "instantRespawn" | "timedRespawn" | "noRespawn"

export interface GameSettingInformation {
    mapBounds: { start: Vector3, end: Vector3 }
    deathSequence: DeathSequenceType
}

export interface GameEventData {
    players: Player[]
}