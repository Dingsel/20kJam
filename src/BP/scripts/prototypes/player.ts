import { Block, Dimension, Player, system, Vector3 } from "@minecraft/server";

type CoinDisplayType = "hidden" | "shown" | "refreshing"

interface RTPlayer {
    coins: number
    setCoinDisplay: (string: CoinDisplayType) => void
}

declare module "@minecraft/server" {
    interface Player {
        selectedKitIndex: number | undefined;
        lastHitBy: Player | undefined
        rt: RTPlayer
        isDead: boolean
        coinRefreshTimer: number | undefined
    }
    interface Entity {
        lastBounceTime: number | undefined
    }
    interface Dimension {
        tryGetBlock(location: Vector3): Block | undefined
    }
}

Dimension.prototype.tryGetBlock = function (location: Vector3): Block | undefined {
    try {
        return this.getBlock(location)
    } catch (error) {
        return
    }
}


Object.defineProperty(Player.prototype, "rt", {
    get() {
        const player = this as Player;
        return {
            setCoinDisplay(string: CoinDisplayType) {
                const coins = player.rt.coins
                switch (string) {
                    case "hidden":
                        player.sendMessage(`RTKJAM:coins_out${coins}`)
                        break
                    case "shown":
                        if (typeof player.coinRefreshTimer !== "undefined") system.clearRun(player.coinRefreshTimer)

                        player.coinRefreshTimer = system.runInterval(() => {
                            if (!player.isValid()) {
                                player.coinRefreshTimer && system.clearRun(player.coinRefreshTimer)
                                return
                            }
                            player.rt.setCoinDisplay("refreshing")
                        }, 600)

                        player.sendMessage(`RTKJAM:coins_in${coins}`)
                        break
                    case "refreshing":
                        player.sendMessage(`RTKJAM:coins_nothing${coins}`)
                        break
                }
            },

            get coins() {
                return (player.getDynamicProperty(`rt:coins`) as number | undefined) ?? 0;
            },
            set coins(value: number) {
                const prevVal = player.rt.coins
                if (value > prevVal) {
                    player.playSound("rt:coins")
                    player.dimension.spawnParticle("rt:coins", player.location)
                    player.sendMessage(`RTKJAM:coins_update${value}`)
                }

                player.setDynamicProperty(`rt:coins`, value)
                if (typeof player.coinRefreshTimer !== "undefined") system.clearRun(player.coinRefreshTimer)

                player.coinRefreshTimer = system.runInterval(() => {
                    if (!player.isValid()) {
                        player.coinRefreshTimer && system.clearRun(player.coinRefreshTimer)
                        return
                    }
                    player.rt.setCoinDisplay("refreshing")
                }, 600)
            }
        }
    },
})

export { }