
import { EntityInventoryComponent, GameMode, Player, system, Vector3, world } from "@minecraft/server"
import { GameEventData, GamemodeExport } from "./gamemodes/gamemodeTypes"
import { MinefieldGameMode } from "./gamemodes/minefield/minefield"
import { ParkourGameMode } from "./gamemodes/parkour/parkour"
import BoxFightGameMode from "./gamemodes/boxfight/boxfight"
import { EvadeGameMode } from "./gamemodes/evade/evade"
import { anounceGamemode, shuffleArr } from "./utils"

import "./customComponents/customComponentsHandler"
import "./prototypes/player"
import "./deathSequences"
import { BuildBattle } from "./gamemodes/buildBattle/buildBattle"
import { BouncyBoxGameMode } from "./gamemodes/bouncyBox/bouncyBox"

export const dim = world.getDimension("overworld")
export let activeGamemode: GamemodeExport | null = null

export type Gamemodes = ((eventData: GameEventData) => GamemodeExport | Promise<GamemodeExport>)[]
export type GameRuleSettings = { [key in keyof typeof world.gameRules]?: typeof world.gameRules[key] }

export const isDev = true;

const defaultGameRules: GameRuleSettings = {
    doFireTick: false,
    doWeatherCycle: false,
    doDayLightCycle: false,
    keepInventory: true,
    doEntityDrops: false,
    doInsomnia: false,
    doImmediateRespawn: true,
    doMobLoot: false,
    doMobSpawning: false,
    mobGriefing: false,
    drowningDamage: false,
    pvp: false,
    fallDamage: false,
    spawnRadius: 0,
    doTileDrops: false,
    commandBlocksEnabled: isDev,
    commandBlockOutput: isDev,
    doLimitedCrafting: false,
    naturalRegeneration: true,
    showCoordinates: isDev,
    showTags: false
}

const spawnLocation: Vector3 = {
    x: -45,
    y: 7,
    z: -21
}

const gameModes: Gamemodes = [
    BoxFightGameMode,
    EvadeGameMode,
    ParkourGameMode,
    MinefieldGameMode,
    BuildBattle,
    BouncyBoxGameMode
]

function checkIfWin() {
    return true
}

function applyGameRules(rules: GameRuleSettings) {
    Object.entries(rules).forEach(([key, value]) => {
        // @ts-expect-error
        world.gameRules[key] = value
    })
}

function setupGame() {
    const randomGamemodes: Gamemodes = shuffleArr(gameModes)
    let gamemodeIndex = 0

    async function gameLoop() {
        const gamemodeElementIndex = gamemodeIndex % randomGamemodes.length
        const upcomingGamemode = await randomGamemodes[gamemodeElementIndex]({ players: world.getAllPlayers() })
        activeGamemode = upcomingGamemode

        await anounceGamemode(upcomingGamemode)

        if (upcomingGamemode.gameSettings.gameRuleSettings) applyGameRules(upcomingGamemode.gameSettings.gameRuleSettings)

        for (const player of world.getAllPlayers()) {
            player.setGameMode(upcomingGamemode.gameSettings.gameMode)
        }

        await upcomingGamemode.onceActive?.()

        await new Promise<void>((res) => {
            const runId = system.runInterval(() => {
                upcomingGamemode.whileActive?.()
                if (activeGamemode !== null) return
                system.clearRun(runId)
                res()
            }, 20)
        })

        //Score of a player over 20k
        if (checkIfWin()) {
            world.sendMessage("Hurray you won the Event")
        } else gameLoop()
    }

    gameLoop()
}

//TEMPORARY
system.afterEvents.scriptEventReceive.subscribe(async (event) => {
    const { id, message } = event
    if (id !== "rt:forceGame") return

    const selectedGamemode = gameModes[parseInt(message)]
    if (!selectedGamemode) return

    //TODO: Only valid players
    const upcomingGamemode = await selectedGamemode({ players: world.getAllPlayers() })

    activeGamemode = upcomingGamemode

    await anounceGamemode(upcomingGamemode)

    if (upcomingGamemode.gameSettings.gameRuleSettings) applyGameRules(upcomingGamemode.gameSettings.gameRuleSettings)

    for (const player of world.getAllPlayers()) {
        player.setGameMode(upcomingGamemode.gameSettings.gameMode)
    }

    await upcomingGamemode.onceActive?.()

    await new Promise<void>((res) => {
        const runId = system.runInterval(() => {
            upcomingGamemode.whileActive?.()
            if (activeGamemode !== null) return
            system.clearRun(runId)
            res()
        }, 20)
    })
})

//setupGame()

export async function endRound(playersThatWon: Player[]) {
    await activeGamemode?.dispose?.()

    applyGameRules(defaultGameRules)


    world.getAllPlayers().forEach((player) => {
        if (playersThatWon.includes(player)) {
            activeGamemode?.onPlayerWin?.(player)
            player.playSound("random.levelup", { pitch: 1.5 })
        } else {
            player.playSound("note.didgeridoo", { pitch: 0.66 })
        }

        player.isDead = false
        player.runCommand("clear @s")
        player.setGameMode(GameMode.spectator)
        //TODO SOUND :)
        player.playSound("")
    })

    activeGamemode = null

    await system.waitTicks(60)

    world.getAllPlayers().forEach((player) => {
        player.setGameMode(GameMode.adventure)
        player.addEffect("instant_health", 20, { showParticles: false })
        player.teleport(spawnLocation)
    })
}

/* system.runInterval(() => {
    world.getAllPlayers().forEach((player) => {
        player.setSpawnPoint({ dimension: dim, ...player.location })
    })
}, 5)
 */
world.afterEvents.playerSpawn.subscribe((event) => {
    const { player } = event;
    (player.getComponent('inventory') as EntityInventoryComponent).container?.clearAll()
    player.rt.setCoinDisplay("shown")
})
world.getAllPlayers().forEach((player) => {
    player.rt.setCoinDisplay("shown")
    applyGameRules(defaultGameRules)
})