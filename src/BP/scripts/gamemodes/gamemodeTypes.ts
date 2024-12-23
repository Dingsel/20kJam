import { GameMode, Player, Vector3 } from "@minecraft/server"
import { GameRuleSettings } from "../main"

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
    gameRuleSettings?: GameRuleSettings
    gameMode: GameMode
}

export interface GameEventData {
    players: Player[]
}