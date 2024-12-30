import { EntityInventoryComponent, GameMode, Player, system, Vector3, world } from "@minecraft/server";
import { GameEventData, GamemodeExport } from "../gamemodeTypes";
import { Countdown, useCountdown } from "../../hooks/useCountdown";
import { dim, endRound } from "../../main";
import { useRuneCollectorDisplay } from "./runeCollectorDisplay";
import { Vector3Utils } from "@minecraft/math";
import { lockItem, structure, useLoadingTimer } from "../../utils";
import { getActiveRunes, mobs, runes } from "./runeCollectorStaticData";

const timerIncreasingBlock = "rt:timer_increasing_block"
const coinBlock = "rt:coin_pile"

const treasureMapStructure = structure`treasure_map`
const sword = lockItem("rt:sand_dagger")

const baseSpawnLocation: Vector3 = {
    x: 5013,
    y: 1,
    z: 20
}

const mapStartLocation: Vector3 = {
    x: 4973,
    y: -7,
    z: 35
}

function asignTimers(players: Player[]): Map<Player, Countdown> {
    return new Map<Player, Countdown>(players.map((x) => {
        return [x, useCountdown(90 * 20)]
    }))
}

async function spawnRandomMobs(ammount: number, location: Vector3) {
    for (let i = 0; i < ammount; i++) {
        const mob = mobs[Math.floor(Math.random() * mobs.length)]
        dim.spawnEntity(mob, location)
        dim.playSound("random.pop", location, { pitch: 1.0 + i * 0.2 })
        await system.waitTicks(10)
    }
}

async function useCamera(player: Player): Promise<void> {
    player.camera.setCamera("minecraft:free", { rotation: { x: 0, y: -90 }, location: { x: 4990, y: -4, z: 45.5 } })
    player.camera.setCamera("minecraft:free", { rotation: { x: 10, y: -90 }, location: { x: 4988, y: -4, z: 45.5 }, easeOptions: { easeTime: 5 } })

    for (let i = 0; i < 5; i++) {
        player.onScreenDisplay.setActionBar('§aCollect as many Coins as you can!')
        await system.waitTicks(20)
    }

    player.camera.clear()
}

export async function RuneCollectorGameMode({ players }: GameEventData): Promise<GamemodeExport> {
    const expiredPlayers = []
    const timers = asignTimers(players)
    const playerCoinMap: Map<Player, number> = new Map<Player, number>(players.map((x) => [x, 0]))
    const display = useRuneCollectorDisplay({ players, timers, playerCoinMap })

    timers.forEach(async (timer, player) => {
        timer.onTimeDown(() => {
            expiredPlayers.push(player)
            if (expiredPlayers.length === players.length) {
                endRound([])
            }
        })
    })

    const interactionEvent = world.afterEvents.playerInteractWithBlock.subscribe((event) => {
        const { block, player } = event

        switch (block.typeId) {
            case timerIncreasingBlock:
                const timer = timers.get(player)
                timer?.addTime(5 * 20)
                block.setType("minecraft:air")
                break;
            case coinBlock:
                const isTrap = Math.random() <= 0.33
                if (isTrap) {
                    player.playSound("mob.cat.meow", { pitch: 0.5 })
                    player.sendMessage("§cOh no! You triggered a trap!")
                    spawnRandomMobs(3, block.location)
                } else {
                    const coins = block.permutation.getState("rt:coin_tier") as number * 50
                    block.dimension.spawnParticle("rt:coins", block.location)
                    playerCoinMap.set(player, playerCoinMap.get(player)! + coins)
                    player.rt.coins += coins
                }
                block.setType("minecraft:air")
                break;
        }
    })

    const hurtEvent = world.afterEvents.entityHurt.subscribe((event) => {
        const { damage, hurtEntity } = event
        if (!(hurtEntity instanceof Player) || damage < 0) return
        const timer = timers.get(hurtEntity)
        if (!timer) return

        if (getActiveRunes(hurtEntity)["rt:rune_of_forgiveness"]) {
            timer.addTime(-damage * 10)
            hurtEntity.sendMessage(`§c-${(damage / 2).toFixed(2)} seconds §7§l(HALVED)`)
            hurtEntity.addEffect("instant_health", 20, { amplifier: 255, showParticles: false })
        } else {
            timer.addTime(-damage * 20)
            hurtEntity.sendMessage(`§c-${damage.toFixed(2)} seconds`)
            hurtEntity.addEffect("instant_health", 20, { amplifier: 255, showParticles: false })
        }
    })

    const deadEvent = world.afterEvents.entityDie.subscribe(async (event) => {
        const { damageSource, deadEntity } = event
        const player = damageSource.damagingEntity

        if (deadEntity instanceof Player || !(player instanceof Player)) return
        const runeMap = getActiveRunes(player)

        if (runeMap["rt:rune_of_greed"]) {
            player.rt.coins += 155
            playerCoinMap.set(player, playerCoinMap.get(player)! + 155)
            player.sendMessage("§a+155 Coins §7§l(RUNE OF GREED)")
        }

        if (runeMap["rt:rune_of_destiny"]) {
            const timer = timers.get(player)!
            timer?.addTime(5 * 20)
            player.sendMessage("§a+5 seconds §7§l(RUNE OF DESTINY)")
        }

        const mayDropRune = Math.random() <= 0.66
        if (!mayDropRune) return

        const randomRune = runes[Math.floor(Math.random() * runes.length)]
        dim.spawnItem(randomRune, deadEntity.location)
        player.sendMessage("§aYou found a Rune!")

        for (let i = 0; i < 3; i++) {
            player.playSound("note.pling", { pitch: 1 + i * 0.3 })
            await system.waitTicks(5)
        }

    })

    return {
        displayName: "Rune Collector",
        typeId: "rt:rune_collector",
        gamemodeType: "Solo",
        gameSettings: {
            gameMode: GameMode.adventure,
            deathSequence: "noRespawn"
        },
        async onceActive() {
            system.run(async () => {
                players.forEach(async (player) => {
                    player.setGameMode(GameMode.spectator);
                    const $ = (await this);
                    $.spawnPlayer(player)

                    await system.waitTicks(50)
                    world.structureManager.place(treasureMapStructure, dim, mapStartLocation)
                    await system.waitTicks(50)
                    useCamera(player)
                    await system.waitTicks(100)

                    const container = (player.getComponent("inventory") as EntityInventoryComponent).container
                    container?.setItem(0, sword)

                    const timer = timers.get(player)!
                    timer.start()
                    player.setGameMode($.gameSettings.gameMode)
                })

                await useLoadingTimer(5, players);
            })
        },

        whileActive() {
            display.updateDisplay()
        },

        spawnPlayer(player) {
            const randomOffset: Vector3 = {
                x: Math.floor(Math.random() * 4) - 2,
                y: 0,
                z: Math.floor(Math.random() * 10) - 5
            }

            player.teleport(Vector3Utils.add(baseSpawnLocation, randomOffset))
        },

        dispose() {
            world.afterEvents.playerInteractWithBlock.unsubscribe(interactionEvent)
            world.afterEvents.entityHurt.unsubscribe(hurtEvent)
            world.afterEvents.entityDie.unsubscribe(deadEvent)
            timers.forEach((timer) => timer.dispose())
        },
    }
}