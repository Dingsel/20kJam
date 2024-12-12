import { ItemStack } from "@minecraft/server"

interface BoxFightKitItemDetails {
    slot: number
    item: ItemStack
}

interface BoxFightKit {
    displayName: string
    typeId: string
    kitItems: BoxFightKitItemDetails[]
}

const kits: BoxFightKit[] = [

]