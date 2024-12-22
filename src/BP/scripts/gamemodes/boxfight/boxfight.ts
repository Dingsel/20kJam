import { BlockVolume, Entity, EntityEquippableComponent, EntityInventoryComponent, EquipmentSlot, ItemStack, Player, Vector3, world } from "@minecraft/server"
import { GameEventData, GamemodeExport } from "../gamemodeTypes"
import { activeGamemode, dim, endRound } from "../../main"
import { useCountdown } from "../../hooks/useCountdown"
import { useBoxfightDisplay } from "./boxfigtDisplay"
import { BoxfightPregame } from "./pregame"

const { start, end } = {
    start: {
        x: -1,
        y: -58,
        z: -1
    },
    end: {
        x: 1,
        y: -58,
        z: 1
    }
}

const vol = new BlockVolume(start, end)
const BLOCK_NEEDED_FOR_WIN = vol.getCapacity()

const TEAM_1_BLOCK = "minecraft:orange_concrete_powder"
const TEAM_2_BLOCK = "minecraft:purple_concrete_powder"
const winCond = [{ block: TEAM_1_BLOCK, teamId: 0 }, { block: TEAM_2_BLOCK, teamId: 1 }]

const teamSpawnLocations = [
    {
        x: 0,
        y: -55,
        z: -19
    },
    {
        x: 0,
        y: -55,
        z: 19
    }
] as const

export async function BoxFightGameMode({ players }: GameEventData): Promise<GamemodeExport> {
    const { playerTeamMap, getSelectedKit, dispose } = await BoxfightPregame({ players })

    const timer = useCountdown(180 * 20)
    const display = useBoxfightDisplay({
        players,
        teamMap: playerTeamMap,
        timer
    })

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
                    playerTeamMap.get(x)?.teamId === teamId
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
                    playerTeamMap.get(x)?.teamId === winningTeam
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
            deathSequence: "noRespawn"
        },

        spawnPlayer(player) {
            const teamData = playerTeamMap.get(player)
            if (!teamData) return
            const spawnLoc = teamSpawnLocations[teamData.teamId] || teamSpawnLocations[0]
            player.teleport(spawnLoc, { facingLocation: start })
        },

        async onceActive() {
            for (const [player, { teamId }] of playerTeamMap.entries()) {
                if (!player || !player.isValid()) return

                const container = (player.getComponent("inventory") as EntityInventoryComponent).container
                const equipment = player.getComponent("equippable") as EntityEquippableComponent

                if (teamId === 0) {
                    player.nameTag = `§6[ORANGE] ${player.name}`
                    container?.setItem(8, new ItemStack(TEAM_1_BLOCK, 64))
                } else {
                    player.nameTag = `§u[PURPLE] ${player.name}`
                    container?.setItem(8, new ItemStack(TEAM_2_BLOCK, 64))
                }

                const { kitItems } = getSelectedKit(player)
                if (kitItems.offhand) {
                    equipment.setEquipment(EquipmentSlot.Offhand, kitItems.offhand)
                }

                kitItems.items?.forEach(({ slot, item }) => {
                    container?.setItem(slot, item)
                });

                (await this).spawnPlayer(player)

                //TODO: FANCY ANOUNCER HERE
            }
        },

        whileActive() {
            display.updateDisplay()
        },

        onPlayerWin(player) {
            console.warn("We would add coins here for player ", player.name)
        },

        dispose() {
            dispose()
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