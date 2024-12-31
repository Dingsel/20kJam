import { ItemLockMode, ItemStack, ItemType, Player, Structure, system, world } from "@minecraft/server";
import { GamemodeExport } from "./gamemodes/gamemodeTypes";
import { DisplayHandler } from "./display/displayHandler";
import { GameRuleSettings } from "./main";

export function shuffleArr<T extends any[]>(array: T): T {
    for (let i = array.length - 1; i > 0; i--) {
        let rand = Math.floor(Math.random() * (i + 1));
        [array[i], array[rand]] = [array[rand], array[i]]
    }
    return array
}

export async function anounceGamemode(gamemode: GamemodeExport): Promise<void> {
    world.getAllPlayers().forEach(async (player) => {
        player.playSound("random.levelup")
        await system.waitTicks(20)
        player.playSound("rt:jingle", { volume: 9999 })
        await system.waitTicks(30)
        player.camera.fade({ fadeColor: { red: 0, blue: 0, green: 0 }, fadeTime: { fadeInTime: 0.5, fadeOutTime: 0.5, holdTime: 7 } })
    })

    await system.waitTicks(20)
    world.sendMessage(`here would some fancy anouncement go for ${gamemode.displayName}`)
    return system.waitTicks(60)
}

export async function chooseGamemode(gamemodeIndex: number): Promise<void> {
    const players = world.getAllPlayers()
    const random = Math.floor(Math.random() * 4)

    players.forEach((player) => {
        if (!player.isValid()) return
        player.sendMessage(`RTKJAM:cgamea${gamemodeIndex}b${random}`)
    })

    await system.waitTicks(17)

    players.forEach((player) => {
        player.playSound("rt:spin")
    })

    await system.waitTicks(9 * 20)
}

export async function titleCountdown(
    remainingSeconds: number,
    targetPlayers?: Player[],
    soundSettings = {
        tickSound: "random.click",
        actionbar: false,
        endSound: "note.pling",
        endText: "§aGO",
        extraText: "§2Respawning in §a",
        pitch: 1
    }
): Promise<void> {
    targetPlayers?.forEach((player) => {
        if (remainingSeconds <= 0) {
            player.playSound(soundSettings.endSound, { volume: 10000000 })
            player.onScreenDisplay.setActionBar(soundSettings.endText)
            player.sendMessage("RTKJAM:stext")

        } else {
            if (soundSettings.actionbar) {
                player.onScreenDisplay.setActionBar(soundSettings.extraText + (String(remainingSeconds)))
            } else {
                player.sendMessage("RTKJAM:stext" + soundSettings.extraText + (String(remainingSeconds)))
            }
            player.playSound(soundSettings.tickSound, { volume: 100000, pitch: soundSettings.pitch })
        }
    })

    if (remainingSeconds >= 1) {
        await system.waitTicks(20)
        await titleCountdown(remainingSeconds - 1, targetPlayers, soundSettings)
    }
}

export function lockItem(itemType: ItemType | string, amount?: number): ItemStack {
    const stack = new ItemStack(itemType, amount)
    stack.lockMode = ItemLockMode.inventory
    return stack
}

export function structure([structureId]: TemplateStringsArray): Structure {
    const structure: Structure | undefined = world.structureManager.get(structureId)
    if (!structure) throw new Error(`Structure with id ${structureId} not found`)
    return structure
}

export async function useLoadingTimer(seconds: number, targetPlayers: Player[]): Promise<void> {
    targetPlayers.forEach(async (player) => {
        player.inputPermissions.movementEnabled = false
        for (let i = 0; i < 5; i++) {
            player.sendMessage("RTKJAM:stext" + '§aLoading§2' + ('.').repeat((i % 3) + 1))
            await system.waitTicks(20)
        }
    })

    await system.waitTicks(100)
    await titleCountdown(seconds, targetPlayers, { endSound: "random.orb", endText: "§aGO", tickSound: "random.click", extraText: "§2Starting in §a", actionbar: false, pitch: 1 })
    targetPlayers.forEach((player) => player.inputPermissions.movementEnabled = true)
}

export function applyGameRules(rules: GameRuleSettings) {
    Object.entries(rules).forEach(([key, value]) => {
        // @ts-expect-error
        world.gameRules[key] = value
    })
}

export function sendError(player: Player, message: string): void {
    player.playSound("mob.villager.no")
    player.sendMessage(`§c${message}`)
}


type TypeWriterOptions = {
    timeoutDuration?: number
    skippedCharacters?: string[]
    //holdingCharacters?: string[]
}

export async function useTypeWriter(textToType: string, onText: (str: string) => any, typeWriterOptions: TypeWriterOptions) {
    for (const char of textToType) {
        if (typeWriterOptions.skippedCharacters?.includes(char)) {
            onText(char)
            continue
        }
        onText(char)
        await system.waitTicks(typeWriterOptions.timeoutDuration || 1)
    }
}