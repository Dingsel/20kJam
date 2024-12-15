import { EntityInventoryComponent, ItemLockMode, ItemStack, Player, system, world } from "@minecraft/server"
import { uiManager } from "@minecraft/server-ui"
import { splitupPlayers } from "../../hooks/splitupPlayers"
import { kitForm, kits } from "./staticData"

export interface BoxFightKitItemDetails {
    slot: number
    item: ItemStack
}

export interface KitItems {
    offhand?: ItemStack
    items?: BoxFightKitItemDetails[]
}

export interface BoxFightKit {
    displayName: string
    typeId: string
    kitItems: KitItems
}

const KitSelectorItem = new ItemStack("rt:box_fight_kit_selector")
KitSelectorItem.lockMode = ItemLockMode.inventory

type BoxfightPregame = {
    dispose: () => void
    getSelectedKit: (player: Player) => BoxFightKit
} & ReturnType<typeof splitupPlayers>

export function BoxfightPregame({ players }: { players: Player[] }): Promise<BoxfightPregame> {
    const teamData = splitupPlayers(2, players)

    players.forEach((p) => {
        p.runCommand("clear @s")
        const container = (p.getComponent("inventory") as EntityInventoryComponent).container
        container?.setItem(8, KitSelectorItem)
    })

    const event = world.afterEvents.itemUse.subscribe(async (ev) => {
        const { itemStack, source } = ev
        if (
            !players.includes(source) ||
            itemStack.typeId !== KitSelectorItem.typeId
        ) return

        const res = await kitForm.show(source)
        if (!res || typeof res.selection === "undefined") return

        const kit = kits[res.selection]
        if (kit) {
            source.selectedKitIndex = res.selection
        }
    })

    function dispose() {
        players.forEach((p) => {
            if (!p.isValid()) return
            p.selectedKitIndex = undefined
        })
        world.afterEvents.itemUse.unsubscribe(event)
    }

    return new Promise(async (resolve) => {
        await system.waitTicks(20 * 20) //20 sec pregame loby time

        players.forEach((p) => {
            if (!p.isValid()) return
            uiManager.closeAllForms(p)
        })

        resolve({
            ...teamData,
            getSelectedKit(player) {
                if (typeof player.selectedKitIndex === "undefined") {
                    player.selectedKitIndex = Math.floor(Math.random() * kits.length)
                }
                return kits[player.selectedKitIndex]
            },
            dispose
        })
    })
} 