import { Player, system } from "@minecraft/server"
import { useCountdown } from "./useCountdown"

export async function useXpBarTimer(targetTimeInTicks: number) {
    const startTime = system.currentTick
    let endTime = startTime + targetTimeInTicks

    return {
        setRemainingXP(player: Player) {
            const fillPercentage = (endTime - system.currentTick) / targetTimeInTicks

            const remainingSeconds = Math.trunc((endTime - system.currentTick) / 20)
            //player.level = remainingSeconds

            const xpFill = player.totalXpNeededForNextLevel * fillPercentage

        }
    }
}