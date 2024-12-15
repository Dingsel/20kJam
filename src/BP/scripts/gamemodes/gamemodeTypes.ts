import { Player, Vector3 } from "@minecraft/server"

export type GamemodeType = "Solo" | "Team"

export interface GamemodeExport {
    displayName: string
    typeId: string
    gamemodeType: GamemodeType
    gameSettings: GameSettingInformation

    spawnPlayer: (player: Player) => void

    onceActive?: () => void | Promise<void>
    whileActive?: () => void | Promise<void>
    dispose?: () => void | Promise<void>
    onPlayerWin?: (player: Player) => void
}

export type DeathSequenceType = "instantRespawn" | "timedRespawn" | "noRespawn"

export interface GameSettingInformation {
    deathSequence: DeathSequenceType
}

export interface GameEventData {
    players: Player[]
}