import { system, Vector3, world } from "@minecraft/server";
import { dim } from "./main";
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

export function doWinningSequence() {
    const players = world.getAllPlayers()

    const winningPlayers = players.filter((player) => player.rt.coins >= 20000)
    const losingPlayers = players.filter((player) => player.rt.coins < 20000)

    winningPlayers.forEach((player, i) => {
        player.teleport(winingPlayerLocation)
        player.sendMessage("§aCongratulations! You won!")
    })

    losingPlayers.forEach((player, i) => {
        const randomLoosingPlayerLocationIndex = loosingPlayerLocations[Math.floor(Math.random() * loosingPlayerLocations.length)]
        player.teleport(randomLoosingPlayerLocationIndex)
        player.sendMessage("§6Nice Try")
    })

    const winningInterval = system.runInterval(async () => {
        try {

            function spawnFirework() {
                const randomOffset: Vector3 = {
                    x: Math.random() * 4 - 2,
                    y: 0,
                    z: Math.random() * 4 - 2
                }
                dim.spawnEntity("minecraft:firework_rocket", Vector3Utils.add(winingPlayerLocation, randomOffset))
            }
            spawnFirework()
            const shouldShootAnother = Math.random() > 0.5
            await system.waitTicks(10)
            if (shouldShootAnother) spawnFirework()

        } catch (error) {
            system.clearRun(winningInterval)
        }
    }, 40)

    system.runTimeout(() => {
        system.clearRun(winningInterval)
    }, 200)
}