import { VECTOR3_UP, Vector3Utils } from "@minecraft/math";
import { CustomComponent } from "./customComponentsHandler";

export const ExplosionTriggerStep: CustomComponent = {
    typeId: "rt:explosion_trigger_step",
    component: {
        onStepOn(event) {
            const { entity, block } = event
            if (!entity || !entity.isValid()) return
            block.dimension.createExplosion(Vector3Utils.add(block.location, VECTOR3_UP), 1.5, { breaksBlocks: false, allowUnderwater: true, causesFire: false })
            block.setType("minecraft:black_concrete")
        },
    }
}