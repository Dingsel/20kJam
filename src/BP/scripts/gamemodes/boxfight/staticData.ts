import { ActionFormData } from "@minecraft/server-ui"
import { lockItem } from "../../utils"
import { BoxFightKit } from "./pregame"

const arrows = lockItem("minecraft:arrow", 16)
const stoneSword = lockItem("minecraft:stone_sword")
const crossbow = lockItem("minecraft:crossbow")

const shield = lockItem("minecraft:shield")
const ironSword = lockItem("minecraft:iron_sword")
const goldenApple = lockItem("minecraft:golden_apple", 2)

export const kits: BoxFightKit[] = [
    {
        displayName: "Test",
        typeId: "test",
        kitItems: {
            offhand: arrows,
            items: [
                {
                    item: stoneSword,
                    slot: 0
                },
                {
                    item: crossbow,
                    slot: 1
                }
            ]
        }
    },
    {
        displayName: "Test2",
        typeId: "test2",
        kitItems: {
            offhand: shield,
            items: [
                {
                    item: ironSword,
                    slot: 0
                },
                {
                    item: goldenApple,
                    slot: 1
                }
            ]
        }
    }
]

export const kitForm = new ActionFormData()
kitForm.title("vanilla.Select Your Kit")
kitForm.body("")

for (const kit of kits) {
    kitForm.button(kit.displayName)
}
