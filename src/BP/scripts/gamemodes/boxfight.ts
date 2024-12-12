import { BlockVolume, BlockVolumeBase, system, Vector3, world } from "@minecraft/server"
import { splitupPlayers } from "../hooks/splitupPlayers"
import { GameEventData, GamemodeExport } from "./gamemodeTypes"
import { activeGamemode, dim, endRound } from "../main"

const { start, end } = {
    start: {
        x: 0,
        y: -60,
        z: 0
    },
    end: {
        x: 2,
        y: -60,
        z: 2
    }
}

const vol = new BlockVolume(start, end)
const BLOCK_NEEDED_FOR_WIN = 9

const TEAM_1_BLOCK = "minecraft:orange_concrete_powder"
const TEAM_2_BLOCK = "minecraft:purple_concrete_powder"
const winCond = [{ block: TEAM_1_BLOCK, teamId: 0 }, { block: TEAM_2_BLOCK, teamId: 1 }]

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

    function checkIfGameWon() {
        for (const { block, teamId } of winCond) {
            if (dim.getBlocks(vol, { includeTypes: [block] }, true).getCapacity() < BLOCK_NEEDED_FOR_WIN) continue
            const winningPlayers = players.filter(x => {
                return (
                    x.isValid() &&
                    playerTeamMap.get(x.id)?.teamId === teamId
                )
            })
            endRound(winningPlayers)
            return
        }
    }

    const event = world.afterEvents.playerPlaceBlock.subscribe((event) => {
        const { block, player } = event
        if (activeGamemode?.typeId !== "rt:boxfight") return
        checkIfGameWon()
    })

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

        dispose() {
            world.afterEvents.playerPlaceBlock.unsubscribe(event)
        },
    }
}

export default BoxFightGameMode