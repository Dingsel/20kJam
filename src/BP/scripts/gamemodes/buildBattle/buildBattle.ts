import { EntityInventoryComponent, GameMode, Player, system, world } from "@minecraft/server";
import { useCountdown } from "../../hooks/useCountdown";
import { GameEventData, GamemodeExport } from "../gamemodeTypes";
import { generateMap } from "./pregame";
import { activeGamemode, endRound } from "../../main";
import { lockItem, useLoadingTimer } from "../../utils";
import { useBuildBattleDisplay } from "./buildBattleDisplay";

async function useCamera(player: Player): Promise<void> {
    system.run(async () => {
        player.camera.setCamera("minecraft:free", { rotation: { x: 0, y: 60 }, location: { x: 1010, y: 6, z: 1016 } })
        player.camera.setCamera("minecraft:free", { rotation: { x: 0, y: 60 }, location: { x: 1010, y: 7, z: 1014 }, easeOptions: { easeTime: 2.5 } })
        await system.waitTicks(50)

        player.camera.setCamera("minecraft:free", { rotation: { x: 0, y: 60 }, location: { x: 1024, y: 5, z: 1013 } })
        player.camera.setCamera("minecraft:free", { rotation: { x: 0, y: 60 }, location: { x: 1024, y: 7, z: 1011 }, easeOptions: { easeTime: 3 } })

    })

    for (let i = 0; i < 5; i++) {
        player.onScreenDisplay.setActionBar('§aBe the first to reach the exit!')
        await system.waitTicks(20)
    }

    player.camera.clear()

}

const shear = lockItem("minecraft:shears")
const pickaxe = lockItem("minecraft:iron_pickaxe")

export async function BuildBattle(game: GameEventData): Promise<GamemodeExport> {
    const { players } = game
    const { dispose, playerMapSettings } = await generateMap(game)

    const timer = useCountdown(150 * 20)
    const display = useBuildBattleDisplay({ players, timer, playerMapSettings })

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

        player.rt.coins += 750

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

        async onceActive() {
            for (const player of players) {
                const info = playerMapSettings.get(player)
                const container = (player.getComponent("inventory") as EntityInventoryComponent).container
                player.setGameMode(GameMode.spectator)
                if (!info || !container) continue
                container.setItem(0, pickaxe)
                container.setItem(1, shear)
                player.teleport(info.spawnLocation)
            }

            system.run(async () => {
                useLoadingTimer(5, players)
                await system.waitTicks(100)
                players.forEach(useCamera)
                await system.waitTicks(100)
    
                players.forEach(async player => player.setGameMode((await this).gameSettings.gameMode))
    
                timer.start()
            })
        },

        whileActive() {
            display.updateDisplay()
        },

        spawnPlayer(player) {
            const info = playerMapSettings.get(player)
            if (!info) {
                console.warn("heh?")
                return
            }
            player.setSpawnPoint({ ...info.spawnLocation, dimension: player.dimension })
            player.teleport(info.spawnLocation)
        },

        dispose() {
            timer.dispose()
            world.afterEvents.playerPlaceBlock.unsubscribe(event)
            dispose()
        },
    }
}