import { ActionFormData } from "@minecraft/server-ui"
import { lockItem } from "../../utils"
import { BoxFightKit } from "./pregame"
import { ItemDurabilityComponent } from "@minecraft/server"

const arrowsSniper = lockItem("minecraft:arrow", 8)
const stoneSword = lockItem("minecraft:stone_sword")
const crossbow = lockItem("minecraft:crossbow")
const leatherHelmet = lockItem("minecraft:leather_helmet")

const shield = lockItem("minecraft:shield");
(shield.getComponent('durability') as ItemDurabilityComponent).damage = 100
const ironSword = lockItem("minecraft:iron_sword")
const leatherBoots = lockItem("minecraft:leather_boots")
const goldenApple = lockItem("minecraft:golden_apple", 1)

export const kits: BoxFightKit[] = [
    {
        displayName: "Sniper",
        typeId: "sniper",
        kitItems: {
            Offhand: arrowsSniper,
            Head: leatherHelmet,
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
        displayName: "Tank",
        typeId: "tank",
        kitItems: {
            Offhand: shield,
            Feet: leatherBoots,
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
