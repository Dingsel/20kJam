import { EntityInventoryComponent, ItemLockMode, ItemStack, Player } from "@minecraft/server"

export const mobs: string[] = [
    "minecraft:skeleton",
    "minecraft:wither_skeleton",
    "minecraft:husk",
    "minecraft:silverfish",
    "minecraft:spider"
]

type RuneType = "rt:rune_of_destiny" | "rt:rune_of_greed" | "rt:rune_of_forgiveness"

function createRuneItemStack(typeId: RuneType, description: string, colour: string): ItemStack {
    const item = new ItemStack(typeId)
    item.lockMode = ItemLockMode.inventory

    item.setLore([
        "",
        `§7${description}`,
        "",
        `§l§${colour}SPECIAL COLLECTABLE RUNE`
    ])

    return item
}

export const runes: ItemStack[] = [
    createRuneItemStack("rt:rune_of_destiny", "Regain Time When Killing Mobs", "§c"),
    createRuneItemStack("rt:rune_of_greed", "Gain Coins When Killing Mobs", "§e"),
    createRuneItemStack("rt:rune_of_forgiveness", "Loose Half As Much Time Against Mobs", "§a"),
]


export function getActiveRunes(player: Player): { [key in RuneType]?: boolean } {
    const container = (player.getComponent("inventory") as EntityInventoryComponent).container

    if (!container) return {}
    const runeItems: ItemStack[] = []

    for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i)
        if (!item) continue
        if (runes.some(rune => rune.typeId === item.typeId)) {
            runeItems.push(item)
        }
    }

    return runeItems.reduce((prev, curr) => {
        prev[curr.typeId as RuneType] = true
        return prev
    }, {} as { [key in RuneType]?: boolean })
}