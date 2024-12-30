import { BlockCustomComponent, world } from "@minecraft/server";
import { ExplosionTriggerStep } from "./explosionTriggerStep";
import { Usable } from "./usable";
import { RandomizeCoins } from "./randomizeCoin";

export interface CustomComponent {
    typeId: string
    component: BlockCustomComponent
}

const customComponents: CustomComponent[] = [
    ExplosionTriggerStep,
    RandomizeCoins,
    Usable
]

world.beforeEvents.worldInitialize.subscribe((event) => {
    customComponents.forEach(({ typeId, component }) => {
        event.blockComponentRegistry.registerCustomComponent(typeId, component)
    })
})