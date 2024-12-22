import { EntityInventoryComponent, GameMode, Player, world } from "@minecraft/server";
import { useCountdown } from "../../hooks/useCountdown";
import { GameEventData, GamemodeExport } from "../gamemodeTypes";
import { generateMap } from "./pregame";
import { activeGamemode, endRound } from "../../main";
import { lockItem } from "../../utils";

const shear = lockItem("minecraft:shears")
const pickaxe = lockItem("minecraft:iron_pickaxe")

export async function BuildBattle(game: GameEventData): Promise<GamemodeExport> {
    const { players } = game
    const { dispose, playerMapSettings } = await generateMap(game)

    const timer = useCountdown(300 * 20)

    const winningPlayers: Player[] = []

    const event = world.afterEvents.playerPlaceBlock.subscribe((event) => {
        const { block, player } = event
        if (activeGamemode?.typeId !== "rt:buildbattle") return

        const info = playerMapSettings.get(player)
        if (!info) return

        const isInside = info.targetPatternVolume.isInside(block.location)
        if (!isInside) return

        const { x, y, z } = info.buildPatternVolume.from
        const { x: x2, y: y2, z: z2 } = info.buildPatternVolume.to

        const { x: x3, y: y3, z: z3 } = info.targetPatternVolume.from

        const res = player.dimension.runCommand(`
            testforblocks
            ${x} ${y} ${z}
            ${x2} ${y2} ${z2}
            ${x3} ${y3} ${z3}
        `)

        if (res.successCount === 0) return

        info.patternOrder.shift()
        player.dimension.fillBlocks(info.targetPatternVolume, "minecraft:air")

        if (info.patternOrder.length <= 0) {
            winningPlayers.push(player)
            player.setGameMode(GameMode.spectator)
            if (winningPlayers.length !== players.length) return
            endRound(winningPlayers)
            return
        }

        world.structureManager.place(info.patternOrder[0], player.dimension, info.buildPatternVolume.from)
    })

    timer.onTimeDown(() => {
        endRound(winningPlayers)
    })

    return {
        displayName: "Build Battle",
        typeId: "rt:buildbattle",
        gamemodeType: "Solo",

        gameSettings: {
            gameMode: GameMode.adventure,
            deathSequence: "instantRespawn"
        },

        onceActive() {
            for (const player of players) {
                const info = playerMapSettings.get(player)
                const container = (player.getComponent("inventory") as EntityInventoryComponent).container
                if (!info || !container) {
                    player.setGameMode(GameMode.spectator)
                    continue
                }
                container.setItem(0, pickaxe)
                container.setItem(1, shear)
                player.teleport(info.spawnLocation)
            }
        },

        spawnPlayer(player) {
            const info = playerMapSettings.get(player)
            if (!info) {
                console.warn("heh?")
                return
            }
            player.teleport(info.spawnLocation)
        },

        dispose() {
            timer.dispose()
            world.afterEvents.playerPlaceBlock.unsubscribe(event)
            dispose()
        },
    }
}