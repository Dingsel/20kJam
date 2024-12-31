import { EntityInventoryComponent, system, Vector3, world } from "@minecraft/server";
import { anounceTopPlayers, dim, gameStarterItem } from "./main";
import { Vector3Utils } from "@minecraft/math";

const winingPlayerLocation: Vector3 = {
    x: -11.5,
    y: 12.00,
    z: -31.5
}

const loosingPlayerLocations: Vector3[] = [
    {
        x: -16.5,
        y: 12.00,
        z: -39.5
    },
    {
        x: -16.5,
        y: 12.00,
        z: -23.5
    }
]

export async function doWinningSequence() {

    let players = world.getAllPlayers()
    players.forEach((player) => { player.camera.fade({ fadeColor: { red: 0, green: 0, blue: 0 }, fadeTime: { fadeInTime: 0.5, holdTime: 4, fadeOutTime: 0.5 } }) })

    await system.waitTicks(20 * 4)

    players = world.getAllPlayers()

    const winningPlayers = players.filter((player) => player.rt.coins >= 20000)
    const losingPlayers = players.filter((player) => player.rt.coins < 20000)

    await anounceTopPlayers()

    players.forEach((player) => {
        if (!player.isValid()) return
        player.playSound("random.levelup", { pitch: 0.5 })
    })

    winningPlayers.forEach((player, i) => {
        if (!player.isValid()) return
        player.teleport(winingPlayerLocation)
        player.sendMessage("§aCongratulations! You won!")

        const container = (player.getComponent("inventory") as EntityInventoryComponent).container!
        container.setItem(4, gameStarterItem)
    })

    losingPlayers.forEach((player, i) => {
        if (!player.isValid()) return
        const randomLoosingPlayerLocationIndex = loosingPlayerLocations[Math.floor(Math.random() * loosingPlayerLocations.length)]
        player.teleport(randomLoosingPlayerLocationIndex)
        player.sendMessage("§6Better luck next time!")
    })

    const winningInterval = system.runInterval(async () => {
        try {

            function spawnFirework() {
                const randomOffset: Vector3 = {
                    x: Math.random() * 4 - 2,
                    y: 0,
                    z: Math.random() * 4 - 2
                }
                dim.spawnEntity("minecraft:fireworks_rocket", Vector3Utils.add(winingPlayerLocation, randomOffset))
            }
            spawnFirework()
            const shouldShootAnother = Math.random() > 0.5
            await system.waitTicks(10)
            if (shouldShootAnother) spawnFirework()

        } catch (error) {
            system.clearRun(winningInterval)
        }
    }, 20)

    system.runTimeout(() => {
        world.sendMessage(`§uMade by: §dPablo, Yassin and Dingsel`)
        world.sendMessage(`§aThank you for playing!`)
        system.clearRun(winningInterval)
    }, 200)
}