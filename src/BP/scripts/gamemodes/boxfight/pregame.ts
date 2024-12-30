import { EntityInventoryComponent, EquipmentSlot, ItemLockMode, ItemStack, Player, system, world } from "@minecraft/server"
import { uiManager } from "@minecraft/server-ui"
import { splitupPlayers } from "../../hooks/splitupPlayers"
import { kitForm, kits } from "./staticData"
import { titleCountdown } from "../../utils"

export interface BoxFightKitItemDetails {
    slot: number
    item: ItemStack
}

export type KitItems = {
    items?: BoxFightKitItemDetails[]
} & { [key in EquipmentSlot]?: ItemStack }

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
        const container = (p.getComponent("inventory") as EntityInventoryComponent).container
        container?.setItem(4, KitSelectorItem)
        p.selectedSlotIndex = 4
    })

    const event = world.afterEvents.itemUse.subscribe(async (ev) => {
        const { itemStack, source } = ev
        if (
            !players.includes(source) ||
            itemStack.typeId !== KitSelectorItem.typeId
        ) return

        const res = await kitForm.show(source)
        if (!res || typeof res.selection === "undefined") return

        const selectedKitIndex = Math.floor(res.selection / 5)

        const kit = kits[selectedKitIndex]
        if (kit) {
            source.selectedKitIndex = selectedKitIndex
            source.playSound("random.orb", { pitch: 2 })
            source.sendMessage(`§eYou selected the §6${kit.displayName} §eKit!`)
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
        await titleCountdown(20, players, { endSound: "", endText: "", tickSound: "random.click", actionbar: true, extraText: '§2Pick your Kit §a', pitch: 2 })

        players.forEach((p) => {
            if (!p.isValid()) return
            p.runCommand("clear @s")
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