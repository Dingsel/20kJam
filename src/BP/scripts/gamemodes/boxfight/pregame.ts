import { EntityInventoryComponent, ItemLockMode, ItemStack, Player, world } from "@minecraft/server"
import { splitupPlayers } from "../../hooks/splitupPlayers"
import { activeGamemode } from "../../main"
import { ActionFormData } from "@minecraft/server-ui"

interface BoxFightKitItemDetails {
    slot: number
    item: ItemStack
}

interface BoxFightKit {
    displayName: string
    typeId: string
    kitItems: BoxFightKitItemDetails[]
}

const KitSelectorItem = new ItemStack("rt:box_fight_kit_selector")
KitSelectorItem.lockMode = ItemLockMode.inventory

const kits: BoxFightKit[] = [

]

type BoxfightPregame = {
    dispose: () => void
} & ReturnType<typeof splitupPlayers>

export function BoxfightPregame({ players }: { players: Player[] }): Promise<BoxfightPregame> {
    const teamData = splitupPlayers(2, players)

    players.forEach((p) => {
        p.dimension.runCommand("clear @s");
        (p.getComponent("inventory") as EntityInventoryComponent).container?.setItem(8, KitSelectorItem)
    })


    const event = world.afterEvents.itemUse.subscribe((ev) => {
        const { itemStack, source } = ev
        if (
            !players.includes(source) ||
            activeGamemode?.typeId !== "rt:boxfight" ||
            itemStack.typeId !== KitSelectorItem.typeId
        ) return

        const kitForm = new ActionFormData()
            .title("Select Your Kit")
    })

    function dispose() {
        world.afterEvents.itemUse.unsubscribe(event)
    }

    return new Promise((resolve) => {
        resolve({ ...teamData, dispose })
    })
} 