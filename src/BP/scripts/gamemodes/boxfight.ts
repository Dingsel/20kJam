import { system, Vector3 } from "@minecraft/server"
import { splitupPlayers } from "../hooks/splitupPlayers"
import { GameEventData, GamemodeExport } from "./gamemodeTypes"
import { endRound } from "../main"

const goalLocation = {
    start: {
        x: 0,
        y: 20,
        z: 0
    },
    end: {
        x: 3,
        y: 20,
        z: 3
    }
}

export function BoxFightGameMode({ players }: GameEventData): GamemodeExport {
    const { playerTeamMap } = splitupPlayers(2, players)
    const teamSpawnLocations: [Vector3, Vector3] = [
        {
            x: 0,
            y: 20,
            z: -10
        },
        {
            x: 0,
            y: 20,
            z: 10
        }
    ] as const

    return {
        displayName: "Box Fight",
        gamemodeType: "Team",
        typeId: "rt:boxfight",
        gameSettings: {
            mapBounds: {
                start: {
                    x: 0,
                    y: 20,
                    z: 0
                },
                end: {
                    x: 0,
                    y: 20,
                    z: 0
                }
            },
            deathSequence: "noRespawn"
        },

        spawnPlayer(player) {
            const teamData = playerTeamMap.get(player.id)
            if (!teamData) return
            const spawnLoc = teamSpawnLocations[teamData.teamId] || teamSpawnLocations[0]
            player.teleport(spawnLoc)
        },

        async onceActive() {
            await system.waitTicks(100)
            endRound([])
        },

        whileActive() {

        }
    }
}

export default BoxFightGameMode