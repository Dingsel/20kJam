import { BlockCustomComponent, world } from "@minecraft/server";
import { ExplosionTriggerStep } from "./explosionTriggerStep";

export interface CustomComponent {
    typeId: string
    component: BlockCustomComponent
}

const customComponents: CustomComponent[] = [
    ExplosionTriggerStep
]

world.beforeEvents.worldInitialize.subscribe((event) => {
    customComponents.forEach(({ typeId, component }) => {
        event.blockComponentRegistry.registerCustomComponent(typeId, component)
    })
})