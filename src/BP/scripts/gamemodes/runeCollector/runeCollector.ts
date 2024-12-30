import { GameMode, Player, system, Vector3, world } from "@minecraft/server";
import { GameEventData, GamemodeExport } from "../gamemodeTypes";
import { Countdown, useCountdown } from "../../hooks/useCountdown";
import { dim, endRound } from "../../main";
import { useRuneCollectorDisplay } from "./runeCollectorDisplay";
import { Vector3Utils } from "@minecraft/math";
import { useLoadingTimer } from "../../utils";

const timerIncreasingBlock = "rt:timer_increasing_block"
const coinBlock = "rt:coin_pile"

const baseSpawnLocation = {
    x: 5013,
    y: 1,
    z: 20
}

function asignTimers(players: Player[]): Map<Player, Countdown> {
    return new Map<Player, Countdown>(players.map((x) => {
        return [x, useCountdown(60 * 20)]
    }))
}

const mobs: string[] = [
    "minecraft:skeleton",
    "minecraft:wither_skeleton",
    "minecraft:husk",
    "minecraft:silverfish",
    "minecraft:spider",

]

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
    const timers = asignTimers(players)
    const display = useRuneCollectorDisplay({ players, timers })
    const expiredPlayers = []

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
                spawnRandomMobs(3, block.location)
                player.rt.coins += 250
                block.setType("minecraft:air")
                break;
        }
    })

    const hurtEvent = world.afterEvents.entityHurt.subscribe((event) => {
        const { damage, hurtEntity } = event
        if (!(hurtEntity instanceof Player) || damage < 0) return
        const timer = timers.get(hurtEntity)
        if (!timer) return

        timer.addTime(-damage * 20)
        hurtEntity.sendMessage(`§c-${damage} seconds`)
        hurtEntity.addEffect("instant_health", 20, { amplifier: 255, showParticles: false })
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

                    await system.waitTicks(100)
                    useCamera(player)
                    await system.waitTicks(100)

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
            timers.forEach((timer) => timer.dispose())
        },
    }
}