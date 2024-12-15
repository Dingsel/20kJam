
import { GameMode, Player, system, Vector3, world } from "@minecraft/server"
import BoxFightGameMode from "./gamemodes/boxfight/boxfight"
import { GameEventData, GamemodeExport } from "./gamemodes/gamemodeTypes"
import { anounceGamemode, shuffleArr } from "./utils"

export const dim = world.getDimension("overworld")

const spawnLocation: Vector3 = {
    x: 0,
    y: 123,
    z: 0
}

const gameModes: ((eventData: GameEventData) => GamemodeExport)[] = [
    BoxFightGameMode
]

export let activeGamemode: GamemodeExport | null = null

function checkIfWin() {
    return true
}

function setupGame() {
    const randomGamemodes: ((eventData: GameEventData) => GamemodeExport)[] = shuffleArr(gameModes)
    let gamemodeIndex = 0

    async function gameLoop() {
        const upcomingGamemode = randomGamemodes[gamemodeIndex % randomGamemodes.length]({ players: world.getAllPlayers() })
        activeGamemode = upcomingGamemode

        await anounceGamemode(upcomingGamemode)

        upcomingGamemode.onceActive?.()

        await new Promise<void>((res) => {
            const runId = system.runInterval(() => {
                upcomingGamemode.whileActive?.()
                if (activeGamemode !== null) return
                system.clearRun(runId)
                res()
            }, 20)
        })

        if (checkIfWin()) {
            //Score of a player over 20k
            world.sendMessage("Hurray you won the Event")
        } else gameLoop()
    }

    gameLoop()
}

setupGame()

export async function endRound(playersThatWon: Player[]) {
    await activeGamemode?.dispose?.()
    activeGamemode = null

    playersThatWon.forEach(x => {
        activeGamemode?.onPlayerWin?.(x)
    })

    world.getAllPlayers().forEach((player) => {
        player.setGameMode(GameMode.spectator)
        player.playSound("mob.enderdragon.growl")
        player.onScreenDisplay.setTitle(playersThatWon.map(x => x.name).join(","))
    })

    await system.waitTicks(60)

    world.getAllPlayers().forEach((player) => {
        player.setGameMode(GameMode.survival)
        player.teleport(spawnLocation)
    })
}

import { ActionFormData } from "@minecraft/server-ui"

world.getAllPlayers().forEach(player => {
   player.onScreenDisplay.setTitle("TMR12:00"+ `PLA${player.name},,PLN,,,,,,,,,,,,,,,,,PLN,,,,,,,,,,,,,,,,,PLN,,,,,,,,,,,,,,,,,PLD${player.name},,PLN,,,,,,,,,,,,,,,,,PLN,,,,,,,,,,,,,,,,,PLN,,,,,,,,,,,,,,,,,`) 
})