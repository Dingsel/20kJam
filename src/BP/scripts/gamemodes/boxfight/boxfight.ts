import { BlockVolume, EntityEquippableComponent, EntityInventoryComponent, EquipmentSlot, GameMode, ItemStack, Player, system, world } from "@minecraft/server"
import { GameEventData, GamemodeExport } from "../gamemodeTypes"
import { activeGamemode, dim, endRound } from "../../main"
import { useCountdown } from "../../hooks/useCountdown"
import { useBoxfightDisplay } from "./boxfigtDisplay"
import { BoxfightPregame } from "./pregame"
import { sendError, useLoadingTimer } from "../../utils"
import { Vector3Utils } from "@minecraft/math"
import { playerKillParticle } from "../../commonParticles"


async function useCamera(player: Player): Promise<void> {
    player.camera.setCamera("minecraft:free", { rotation: { x: 90, y: 0 }, location: { x: 982.5, y: 22, z: -10.5 } })
    player.camera.setCamera("minecraft:free", { rotation: { x: 90, y: 40 }, location: { x: 982.5, y: 20, z: -10.5 }, easeOptions: { easeTime: 5 } })

    for (let i = 0; i < 5; i++) {
        player.onScreenDisplay.setActionBar('§aBe the first team to fill in the middle!')
        await system.waitTicks(20)
    }

    player.camera.clear()

}

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
        if (!vol.isInside(block.location)) {
            sendError(player, "You Must Replace The Blocks, Not Build On Top Of Them!")
            block.setType("minecraft:air")
        }
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
        } else {
            const teamColour = playerTeamMap.get(deadEntity)?.teamId === 1 ? {
                r: 255,
                g: 180,
                b: 74
            } : {
                r: 201,
                g: 133,
                b: 234
            }
            damigingEntity.playSound("firework.blast", { volume: 0.7 })
            deadEntity.playSound("firework.blast", { volume: 0.7 })
            playerKillParticle.spawn({
                carrier: deadEntity.dimension,
                location: deadEntity.location,
                dynamicParticleVars: teamColour
            })
            damigingEntity.rt.coins += 250
        }
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

        async spawnPlayer(player) {
            const teamData = playerTeamMap.get(player)
            if (!teamData) return
            const spawnLoc = teamSpawnLocations[teamData.teamId] || teamSpawnLocations[0]
            player.setSpawnPoint({ ...spawnLoc, dimension: player.dimension })
            player.teleport(spawnLoc, { facingLocation: start })
            await system.waitTicks(100)
            useCamera(player)
        },

        async onceActive() {
            for (const [player, { teamId }] of playerTeamMap.entries()) {
                if (!player || !player.isValid()) return


                const container = (player.getComponent("inventory") as EntityInventoryComponent).container
                const equipment = player.getComponent("equippable") as EntityEquippableComponent

                if (teamId === 0) {
                    player.nameTag = `§u[PURPLE] ${player.name}`
                    const item = new ItemStack(TEAM_0_BLOCK, 64)
                    item.nameTag = "§r§dPurple §fConcrete Powder"
                    container?.setItem(8, item)
                } else {
                    player.nameTag = `§6[ORANGE] ${player.name}`
                    const item = new ItemStack(TEAM_1_BLOCK, 64)
                    item.nameTag = "§r§6Orange §fConcrete Powder"
                    container?.setItem(8, item)
                }

                const { kitItems } = getSelectedKit(player)
                for (const slot of Object.values(EquipmentSlot)) {
                    const slotKey = slot as keyof typeof EquipmentSlot

                    if (!kitItems[slotKey]) continue

                    equipment.setEquipment(
                        EquipmentSlot[slotKey],
                        kitItems[slotKey]
                    )
                }

                kitItems.items?.forEach(({ slot, item }) => {
                    container?.setItem(slot, item)
                });

                (await this).spawnPlayer(player)

            }
            system.run(async () => {
                system.runTimeout(() => {
                    const newVol = new BlockVolume(start, end)
                    dim.fillBlocks(vol, "minecraft:gray_concrete_powder")

                    newVol.translate({ x: 0, y: -1, z: 0 })
                    dim.fillBlocks(newVol, "minecraft:bedrock")

                    newVol.translate({ x: 0, y: -1, z: 0 })
                    dim.fillBlocks(newVol, "minecraft:allow")

                    const clearVol = new BlockVolume(start, Vector3Utils.add(end, { x: 0, y: 128, z: 0 }))
                    clearVol.translate({ x: 0, y: 1, z: 0 })

                    dim.fillBlocks(clearVol, "minecraft:air")

                    dim.spawnParticle('rt:boxfight_glow', Vector3Utils.add(start, { x: 1.5, y: 1.3, z: -2 + 0.01 }))
                    dim.spawnParticle('rt:boxfight_glow', Vector3Utils.add(start, { x: 1.5, y: 1.3, z: 1 - 0.01 }))
                    dim.spawnParticle('rt:boxfight_glow2', Vector3Utils.add(start, { x: 0 + 0.01, y: 1.3, z: -0.5 }))
                    dim.spawnParticle('rt:boxfight_glow2', Vector3Utils.add(start, { x: 3 - 0.01, y: 1.3, z: -0.5 }))
                }, 60)

                for (const player of players) {
                    player.setGameMode(GameMode.spectator);
                }
                await useLoadingTimer(5, players);
                for (const player of players) {
                    player.setGameMode((await this).gameSettings.gameMode);
                }
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