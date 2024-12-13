
import { GameMode, Player, system, Vector3, world } from "@minecraft/server"
import { GameEventData, GamemodeExport } from "./gamemodes/gamemodeTypes"
import BoxFightGameMode from "./gamemodes/boxfight/boxfight"
import { anounceGamemode, shuffleArr } from "./utils"

type Gamemodes = ((eventData: GameEventData) => GamemodeExport | Promise<GamemodeExport>)[]

export const dim = world.getDimension("overworld")
export let activeGamemode: GamemodeExport | null = null

const spawnLocation: Vector3 = {
    x: 0,
    y: 123,
    z: 0
}

const gameModes: Gamemodes = [
    BoxFightGameMode
]

function checkIfWin() {
    return true
}

function setupGame() {
    const randomGamemodes: Gamemodes = shuffleArr(gameModes)
    let gamemodeIndex = 0

    async function gameLoop() {
        const gamemodeElementIndex = gamemodeIndex % randomGamemodes.length
        const upcomingGamemode = await randomGamemodes[gamemodeElementIndex]({ players: world.getAllPlayers() })
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

//world.getAllPlayers().forEach(player => {
//    const ui = new ActionFormData()
//        .title('RT20K.intro')
//        .button('')
//        .show(player)
//
//})