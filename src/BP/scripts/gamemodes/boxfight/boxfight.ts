import { BlockVolume, Player, Vector3, world } from "@minecraft/server"
import { splitupPlayers } from "../../hooks/splitupPlayers"
import { GameEventData, GamemodeExport } from "../gamemodeTypes"
import { activeGamemode, dim, endRound } from "../../main"
import { useCountdown } from "../../hooks/useCountdown"

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

export function BoxFightGameMode({ players }: GameEventData): GamemodeExport {
    const { playerTeamMap } = splitupPlayers(2, players)
    const timer = useCountdown(180 * 20)

    timer.onTimeDown(() => {
        checkMostPercent()
    })

    const event = world.afterEvents.playerPlaceBlock.subscribe((event) => {
        const { block, player } = event
        if (activeGamemode?.typeId !== "rt:boxfight") return
        checkIfGameWon()
    })

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

    function checkMostPercent() {
        let winningTeam = -1
        let winningTeamScore = -1

        for (const { block, teamId } of winCond) {
            const capactiy = dim.getBlocks(vol, { includeTypes: [block] }, true).getCapacity()
            if (capactiy >= 0 && capactiy >= winningTeamScore) {
                winningTeamScore = capactiy
                winningTeam = teamId
            }
        }

        if (winningTeam !== -1) {
            const winningPlayers = players.filter(x => {
                return (
                    x.isValid() &&
                    playerTeamMap.get(x.id)?.teamId === winningTeam
                )
            })
            endRound(winningPlayers)
            return
        }
        endRound([])
    }

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

        onceActive() {
            console.warn("jnrejerj")
            for (const [playerId, { teamId }] of playerTeamMap.entries()) {
                const player = world.getEntity(playerId) as Player | undefined
                if (!player || !player.isValid()) return
                player.nameTag = `${teamId === 0 ? "§6[ORANGE]" : "§u[PURPLE]"} ${player.name}`
            }
        },

        onPlayerWin(player) {
            console.warn("We would add coins here for player ", player.name)
        },

        dispose() {
            world.afterEvents.playerPlaceBlock.unsubscribe(event)
            timer.dispose()
            players.forEach((player) => {
                if (!player.isValid()) return
                player.nameTag = player.name
            })
        },
    }
}

export default BoxFightGameMode