import { BlockPermutation } from "@minecraft/server";
import { CustomComponent } from "./customComponentsHandler";
import { activeGamemode } from "../main";

const maxState = 6
export const RandomizeCoins: CustomComponent = {
    typeId: "rt:randomize_coin_pile",
    component: {
        onTick(event) {
            if (activeGamemode?.typeId !== "rt:rune_collector") return
            const { block } = event
            if (block.permutation.getState("rt:coin_tier") !== 0) return

            block.setPermutation(BlockPermutation.resolve(block.typeId, {
                "rt:coin_tier": Math.floor(Math.random() * maxState) + 1
            }))
        }
    }
}