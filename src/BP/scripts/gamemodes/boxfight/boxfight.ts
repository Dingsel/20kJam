import { BlockVolume, BlockVolumeBase, Entity, EntityEquippableComponent, EntityInventoryComponent, EquipmentSlot, GameMode, ItemStack, Player, system, Vector3, world } from "@minecraft/server"
import { GameEventData, GamemodeExport } from "../gamemodeTypes"
import { activeGamemode, dim, endRound } from "../../main"
import { useCountdown } from "../../hooks/useCountdown"
import { useBoxfightDisplay } from "./boxfigtDisplay"
import { BoxfightPregame } from "./pregame"
import { useLoadingTimer } from "../../utils"

const { start, end } = {
    start: {
        x: 981,
        y: 9,
        z: -10
    },
    end: {
        x: 983,
        y: 9,
        z: -12
    }
}

const vol = new BlockVolume(start, end)
const BLOCK_NEEDED_FOR_WIN = vol.getCapacity()

const TEAM_0_BLOCK = "minecraft:purple_concrete_powder"
const TEAM_1_BLOCK = "minecraft:orange_concrete_powder"
const winCond = [{ block: TEAM_0_BLOCK, teamId: 0 }, { block: TEAM_1_BLOCK, teamId: 1 }]

const teamSpawnLocations = [
    {
        x: 982,
        y: 8,
        z: 20
    },
    {
        x: 982,
        y: 8,
        z: -42
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

    const killEvent = world.afterEvents.entityDie.subscribe((event) => {
        const { damageSource, deadEntity } = event
        if (!(deadEntity instanceof Player)) return
        const damigingEntity = damageSource.damagingEntity /* || deadEntity.lastHitBy */
        if (!(damigingEntity instanceof Player)) return

        if (playerTeamMap.get(deadEntity)?.teamId === playerTeamMap.get(damigingEntity)?.teamId) {
            damigingEntity.sendMessage(`§cYou Monster.`)
            damigingEntity.playSound("mob.cat.meow", { pitch: 0.5 })
            damigingEntity.rt.coins -= 250
        } else damigingEntity.rt.coins += 250

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
            for (const player of winningPlayers) {
                player.rt.coins += 1000
            }
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
            for (const player of winningPlayers) {
                player.rt.coins += 1000
            }
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
            gameMode: GameMode.adventure,
            deathSequence: "noRespawn",
            gameRuleSettings: {
                pvp: true
            }
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
                    player.nameTag = `§u[PURPLE] ${player.name}`
                    container?.setItem(8, new ItemStack(TEAM_0_BLOCK, 64))
                } else {
                    player.nameTag = `§6[ORANGE] ${player.name}`
                    container?.setItem(8, new ItemStack(TEAM_1_BLOCK, 64))
                }

                const { kitItems } = getSelectedKit(player)
                if (kitItems.offhand) {
                    equipment.setEquipment(EquipmentSlot.Offhand, kitItems.offhand)
                }

                kitItems.items?.forEach(({ slot, item }) => {
                    container?.setItem(slot, item)
                });

                (await this).spawnPlayer(player)
            }
            system.run(async () => {
                const { start, end } = {
                    start: {
                        x: 981,
                        y: 9 - 2,
                        z: -10
                    },
                    end: {
                        x: 983,
                        y: 9 - 2,
                        z: -12
                    }
                }

                const trnsVol = new BlockVolume(start, end)

                dim.fillBlocks(trnsVol, "minecraft:allow")
                trnsVol.translate({ x: 0, y: 1, z: 0 })
                dim.fillBlocks(trnsVol, "minecraft:bedrock")
                trnsVol.translate({ x: 0, y: 1, z: 0 })

                dim.fillBlocks(new BlockVolume(start, { x: 983, y: 128, z: -12 }), "minecraft:air")
                dim.fillBlocks(vol, "minecraft:gray_concrete_powder")


                await useLoadingTimer(5, players)
                timer.start()
            })
        },

        whileActive() {
            display.updateDisplay()
        },

        dispose() {
            dispose()
            world.afterEvents.playerPlaceBlock.unsubscribe(event)
            world.afterEvents.entityDie.unsubscribe(killEvent)
            timer.dispose()
            players.forEach((player) => {
                if (!player.isValid()) return
                player.nameTag = player.name
            })
        }
    }
}

export default BoxFightGameMode