import { CustomComponent } from "./customComponentsHandler";

export const ExplosionTriggerStep: CustomComponent = {
    typeId: "rt:explosion_trigger_step",
    component: {
        onStepOn(event) {
            const { entity, block } = event
            if (!entity || !entity.isValid()) return
            block.dimension.createExplosion(block.location, 3, { breaksBlocks: false, allowUnderwater: true, causesFire: false })
            block.setType("minecraft:bedrock")
        },
    }
}