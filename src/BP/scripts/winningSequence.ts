import { Vector3, world } from "@minecraft/server";

const winingPlayerLocation: Vector3 = {
    x: -11.5,
    y: 12.00,
    z: -31.5
}

const loosingPlayerLocation: Vector3 = {
    x: -11.5,
    y: 12.00,
    z: -31.5    
}

export function doWinningSequence() {
    const players = world.getAllPlayers()

    const winningPlayers = players.filter((player) => player.rt.coins >= 20000)
    const losingPlayers = players.filter((player) => player.rt.coins < 20000)
}