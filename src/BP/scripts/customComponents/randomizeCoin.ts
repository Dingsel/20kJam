import { BlockPermutation, world } from "@minecraft/server";
import { CustomComponent } from "./customComponentsHandler";
import { activeGamemode } from "../main";

const maxState = 6
export const RandomizeCoins: CustomComponent = {
    typeId: "rt:randomize_coin_pile",
    component: {
        onTick(event) {
            if (activeGamemode?.typeId !== "rt:rune_collector") return
            const { block } = event
            if (block.permutation.getState("rt:coin_tier") as number > 0) return

            const rand = Math.random()

            const playerCount = world.getAllPlayers().length / 8

            if (rand <= playerCount) {
                block.setPermutation(BlockPermutation.resolve("rt:coin_pile", {
                    "rt:coin_tier": Math.floor(Math.random() * maxState) + 1
                }))
            } else {
                block.setType("minecraft:air")
            }
        }
    }
}