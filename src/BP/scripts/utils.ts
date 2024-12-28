import { ItemLockMode, ItemStack, ItemType, Player, Structure, system, world } from "@minecraft/server";
import { GamemodeExport } from "./gamemodes/gamemodeTypes";

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
        player.camera.fade({ fadeColor: { red: 0, blue: 0, green: 0 }, fadeTime: { fadeInTime: 0.5, fadeOutTime: 1, holdTime: 2 } })
    })

    await system.waitTicks(20)
    world.sendMessage(`here would some fancy anouncement go for ${gamemode.displayName}`)
    return system.waitTicks(60)
}

export async function titleCountdown(
    remainingSeconds: number,
    targetPlayers?: Player[],
    soundSettings = {
        tickSound: "random.click",
        actionbar: false,
        endSound: "note.pling",
        endText: "§aGO",
        extraText: "§2Respawning in §a"
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
            player.playSound(soundSettings.tickSound, { volume: 100000 })
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
    targetPlayers.forEach((player) => player.inputPermissions.movementEnabled = false)
    await titleCountdown(seconds, targetPlayers, { endSound: "random.orb", endText: "§aGO", tickSound: "random.click", extraText: "§2Starting in §a", actionbar: false })
    targetPlayers.forEach((player) => player.inputPermissions.movementEnabled = true)
}

export function sendError(player: Player, message: string): void {
    player.playSound("entity.villager.no")
    player.sendMessage(`§cError: ${message}`)
}