
import { EntityInventoryComponent, GameMode, ItemStack, Player, system, Vector3, world } from "@minecraft/server"
import { GameEventData, GamemodeExport } from "./gamemodes/gamemodeTypes"
import { MinefieldGameMode } from "./gamemodes/minefield/minefield"
import { ParkourGameMode } from "./gamemodes/parkour/parkour"
import BoxFightGameMode from "./gamemodes/boxfight/boxfight"
import { anounceGamemode, applyGameRules, chooseGamemode, lockItem, shuffleArr, titleCountdown } from "./utils"

import "./customComponents/customComponentsHandler"
import "./prototypes/player"
import "./deathSequences"
import "./npcs"

import { BuildBattle } from "./gamemodes/buildBattle/buildBattle"
import { BouncyBoxGameMode } from "./gamemodes/bouncyBox/bouncyBox"
import { RuneCollectorGameMode } from "./gamemodes/runeCollector/runeCollector"
import { doWinningSequence } from "./winningSequence"

export const dim = world.getDimension("overworld")
export let activeGamemode: GamemodeExport | null = null
export let hostingPlayer: Player | null = null

export type Gamemodes = ((eventData: GameEventData) => GamemodeExport | Promise<GamemodeExport>)[]
export type GameRuleSettings = { [key in keyof typeof world.gameRules]?: typeof world.gameRules[key] }
export const isDev: boolean = false;

export const gameStarterItem = lockItem("rt:game_starter")
let disHostSeeWarning: boolean = false;

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
    ParkourGameMode,
    MinefieldGameMode,
    BuildBattle,
    BouncyBoxGameMode,
    RuneCollectorGameMode
]

function checkIfWin() {
    return world.getAllPlayers().some((player) => player.rt.coins >= 20000)
}

export async function anounceTopPlayers() {
    const players = world.getAllPlayers().sort((a, b) => b.rt.coins - a.rt.coins)
    const topPlayers = players.slice(0, 3)

    for (let i = Math.min(2, topPlayers.length - 1); i >= 0; i--) {
        const player = topPlayers[i]
        const place = i + 1
        world.sendMessage(`§e#§6${place} §a${player.name} §7with §e${player.rt.coins} §7coins`)
        world.getAllPlayers().forEach((p) => { p.playSound("random.pop", { pitch: 1 + (3 - place) * 0.1 }) })
        await system.waitTicks(20)
    }
}

function setupGame() {
    const randomGamemodes: Gamemodes = shuffleArr([...gameModes])
    let gamemodeIndex = 0

    world.getAllPlayers().forEach((player) => {
        player.rt.coins = 0
        player.runCommand("clear @s")
        player.rt.setCoinDisplay("refreshing")
    })

    async function gameLoop() {
        const gamemodeElementIndex = gamemodeIndex % randomGamemodes.length
        await chooseGamemode(gameModes.findIndex(x => x === randomGamemodes[gamemodeElementIndex]))

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
                gamemodeIndex++
                res()
            }, 20)
        })

        //Score of a player over 20k
        if (checkIfWin()) {
            doWinningSequence()
        } else {
            await system.waitTicks(100)
            anounceTopPlayers()
            await system.waitTicks(100)
            gameLoop()
        }
    }
    gameLoop()
}

//TEMPORARY
system.afterEvents.scriptEventReceive.subscribe(async (event) => {
    const { id, message } = event
    if (id !== "rt:forceGame") return
    const gamemodeElementIndex = parseInt(message)
    await chooseGamemode(gamemodeElementIndex)

    const selectedGamemode = gameModes[gamemodeElementIndex]
    if (!selectedGamemode) return
    if (activeGamemode) await endRound([])

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

export async function endRound(playersThatWon: Player[]) {
    if (!activeGamemode) return;
    await activeGamemode.dispose?.()

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
    })

    activeGamemode = null

    await system.waitTicks(60)

    world.getAllPlayers().forEach((player) => {
        player.setGameMode(GameMode.adventure)
        player.addEffect("instant_health", 20, { showParticles: false, amplifier: 255 })

        player.teleport(spawnLocation)
    })
}

system.runInterval(() => {
    world.getAllPlayers().forEach((player) => {
        player.addEffect("saturation", 999, { showParticles: false })
    })
}, 60)

world.afterEvents.playerSpawn.subscribe((event) => {
    const { player } = event;
    player.rt.setCoinDisplay("shown")
    if (!event.initialSpawn) return;
    if (!hostingPlayer) hostingPlayer = player

    if (activeGamemode) {
        player.isDead = true
        player.setGameMode(GameMode.spectator)
    }

    player.rt.coins = 0
    player.runCommand('clear @s')

    player.teleport({ x: -78, y: 6, z: -25.5 })
    player.setGameMode(GameMode.adventure)

    const container = (hostingPlayer.getComponent("inventory") as EntityInventoryComponent).container!
    container.setItem(4, gameStarterItem)
})

world.afterEvents.itemUse.subscribe(async (event) => {
    const { itemStack, source } = event
    if (itemStack.typeId !== gameStarterItem.typeId) return

    const playerCount = world.getAllPlayers().length

    if ((playerCount < 2 || playerCount > 8) && !disHostSeeWarning) {
        source.playSound("mob.villager.no")

        source.sendMessage("§e§lWarning: §r§cThe game needs to have between 2 and 8 players to start.")
        source.sendMessage("§l§eYou can still start the game by right clicking the item again but please note that some gamemodes might not work properly.")

        disHostSeeWarning = true
        return
    }

    source.runCommand('clear @s')
    world.sendMessage(`§cWARNING: This map may contain flashing lights and loud noises. Please be cautious if you have epilepsy or are sensitive to flashing lights.`)
    await system.waitTicks(50)
    source.playSound("random.levelup", { pitch: 1.5 })

    source.sendMessage("§aThe Road To 20k: A Bedrock Add-Ons JAM Project.")
    await system.waitTicks(50)

    await titleCountdown(5, world.getAllPlayers(), {
        endSound: "", endText: "§aHave Fun!", actionbar: true, extraText: "§2Starting in §a", pitch: 1, tickSound: "random.click"
    })

    setupGame()
})

world.getAllPlayers().forEach((player) => {
    player.rt.setCoinDisplay("shown")
    applyGameRules(defaultGameRules)

    if (!hostingPlayer) hostingPlayer = player
    player.runCommand('clear @s')

    const container = (hostingPlayer.getComponent("inventory") as EntityInventoryComponent).container!
    container.setItem(4, gameStarterItem)
})