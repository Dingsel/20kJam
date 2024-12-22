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
    world.sendMessage(`here would some fancy anouncement go for ${gamemode.displayName}`)
    return system.waitTicks(60)
}

export async function titleCountdown(remainingSeconds: number, targetPlayer?: Player): Promise<void> {
    targetPlayer?.playSound("random.click")
    targetPlayer?.onScreenDisplay.setTitle(String(remainingSeconds))

    if (remainingSeconds >= 1) {
        await system.waitTicks(20)
        await titleCountdown(remainingSeconds - 1)
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