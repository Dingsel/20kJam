import { CustomComponent } from "./customComponentsHandler";

export const ExplosionTriggerStep: CustomComponent = {
    typeId: "bp:explosion_trigger_step",
    component: {
        onStepOn(event) {
            const { entity, block } = event
            if (!entity || !entity.isValid() || !block.isValid()) return
            block.dimension.createExplosion(block.location, 2, { breaksBlocks: false, allowUnderwater: true, causesFire: false })
            block.setType("minecraft:air")
        },
    }
}