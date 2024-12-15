import { Player } from "@minecraft/server";


interface RTPlayer {
    points: number
}

declare module "@minecraft/server" {
    interface Player {
        selectedKitIndex: number | undefined;
        rt: RTPlayer
    }
}


Object.defineProperty(Player.prototype, "rt", {
    get() {
        const player = this as Player;
        return {
            get points() {
                return (player.getDynamicProperty(`rt:points`) as number | undefined) ?? 0;
            },
            set points(value: number) {
                player.setDynamicProperty(`rt:points`, value)
            }
        }
    },
})

export { }