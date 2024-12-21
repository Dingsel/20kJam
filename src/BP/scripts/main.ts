
import { GameMode, Player, system, Vector3, world } from "@minecraft/server"
import { GameEventData, GamemodeExport } from "./gamemodes/gamemodeTypes"
import { MinefieldGameMode } from "./gamemodes/minefield/minefield"
import { ParkourGameMode } from "./gamemodes/parkour/parkour"
import BoxFightGameMode from "./gamemodes/boxfight/boxfight"
import { EvadeGameMode } from "./gamemodes/evade/evade"
import { anounceGamemode, shuffleArr } from "./utils"

import "./customComponents/customComponentsHandler"
import "./prototypes/player"

type Gamemodes = ((eventData: GameEventData) => GamemodeExport | Promise<GamemodeExport>)[]

export const dim = world.getDimension("overworld")
export let activeGamemode: GamemodeExport | null = null

const spawnLocation: Vector3 = {
    x: 0,
    y: 123,
    z: 0
}

const gameModes: Gamemodes = [
    BoxFightGameMode,
    EvadeGameMode,
    ParkourGameMode,
    MinefieldGameMode
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

        await upcomingGamemode.onceActive?.()

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

//setupGame()

export async function endRound(playersThatWon: Player[]) {
    await activeGamemode?.dispose?.()
    activeGamemode = null

    playersThatWon.forEach(x => {
        activeGamemode?.onPlayerWin?.(x)
    })

    world.getAllPlayers().forEach((player) => {
        player.isDead = false
        player.setGameMode(GameMode.spectator)
        //TODO SOUND :)
        player.playSound("")
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


world.afterEvents.projectileHitBlock.subscribe((event) => {
    const { projectile } = event
    if (!projectile.isValid() || projectile.typeId !== "rt:falling_anvil") return
    projectile.remove()
})

world.afterEvents.projectileHitEntity.subscribe((event) => {
    const { projectile } = event
    const hitEntity = event.getEntityHit().entity
    if (!projectile.isValid() || projectile.typeId !== "rt:falling_anvil" || !hitEntity) return
    projectile.remove()
    hitEntity.applyDamage(6)
    console.warn(hitEntity.typeId)
})