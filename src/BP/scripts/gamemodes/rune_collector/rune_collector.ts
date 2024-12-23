import { GameMode, Player, world } from "@minecraft/server";
import { GameEventData, GamemodeExport } from "../gamemodeTypes";
import { Countdown, useCountdown } from "../../hooks/useCountdown";
import { endRound } from "../../main";

const timerIncreasingBlock = "rt:timer_increasing_block"
const coinBlock = "rt:coin_block"

function asignTimers(players: Player[]): Map<Player, Countdown> {
    return new Map<Player, Countdown>(players.map((x) => {
        return [x, useCountdown(60 * 20)]
    }))
}

export async function RuneCollectorGameMode({ players }: GameEventData): Promise<GamemodeExport> {
    const timers = asignTimers(players)
    const expiredPlayers = []

    timers.forEach((timer, player) => {
        timer.onTimeDown(() => {
            expiredPlayers.push(player)
            if (expiredPlayers.length === players.length) {
                endRound([])
            }
        })
        timer.start()
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
                player.rt.coins += 250
                block.setType("minecraft:air")
                break;
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
            for (const player of players) {
                (await this).spawnPlayer(player)
            }
        },

        whileActive() {
            timers.forEach((timer, player) => {
                //PABLO FOR TIMER :)
            })
        },

        spawnPlayer(player) {
            player.teleport({ x: 0, y: 100, z: 0 })
        },

        dispose() {
            world.afterEvents.playerInteractWithBlock.unsubscribe(interactionEvent)
            timers.forEach((timer) => timer.dispose())
        },
    }
}