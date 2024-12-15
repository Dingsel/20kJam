import { system } from "@minecraft/server"

interface Countdown {
    addTime: (timeInTicks: number) => this
    dispose: () => void
    getRemaining: () => { ticks: number, seconds: string }
    onTimeDown: (callback: () => any) => void
}

export function useCountdown(targetTimeInTicks: number): Countdown {
    const startTime = system.currentTick
    let endTime = startTime + targetTimeInTicks

    let cbStack: (() => any)[] | null = []

    let timerId = system.runTimeout(() => {
        if (!cbStack) throw new Error("Timer Already Expired")
        cbStack.forEach(x => x())
    }, targetTimeInTicks)

    return {
        addTime(timeInTicks: number) {
            const currentTime = system.currentTick
            if (endTime - currentTime <= 0 || !cbStack) throw new Error("Timer Already Expired")
            endTime += timeInTicks

            system.clearRun(timerId)
            timerId = system.runTimeout(() => {
                if (!cbStack) throw new Error("Timer Already Expired")
                cbStack.forEach(x => x())
            }, endTime - startTime)

            return this
        },

        dispose() {
            system.clearRun(timerId)
            cbStack = null //Allow GC
        },

        getRemaining() {
            const currentTime = system.currentTick
            return {
                get ticks() {
                    return endTime - currentTime
                },

                get seconds() {
                    return ((endTime - currentTime) / 20).toFixed(2)
                }
            }
        },

        onTimeDown(callback: () => any) {
            const currentTime = system.currentTick
            if (endTime - currentTime <= 0 || !cbStack) throw new Error("Timer Already Expired")

            cbStack.push(callback)
        }
    }
}