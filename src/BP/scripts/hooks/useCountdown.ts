import { system } from "@minecraft/server"

export interface Countdown {
    start: () => this
    addTime: (timeInTicks: number) => this
    dispose: () => void
    getRemaining: () => { ticks: number, seconds: string }
    onTimeDown: (callback: () => any) => void
}

export function useCountdown(targetTimeInTicks: number): Countdown {
    let startTime: number | null = null
    let endTime: number | null = null
    let cbStack: (() => any)[] = []
    let timerId: number | undefined

    return {
        start() {
            if (startTime !== null) throw new Error("Timer Already Started")
            startTime = system.currentTick
            endTime = startTime + targetTimeInTicks

            timerId = system.runTimeout(() => {
                if (!cbStack) throw new Error("Timer Already Expired")
                cbStack.forEach(x => x())
            }, targetTimeInTicks)

            return this
        },

        addTime(timeInTicks: number) {
            if (startTime === null) throw new Error("Timer Not Started")
            if (!endTime || !cbStack) throw new Error("Timer Already Expired")

            const currentTime = system.currentTick
            if (endTime - currentTime <= 0) throw new Error("Timer Already Expired")

            endTime += timeInTicks

            if (timerId !== undefined) system.clearRun(timerId)
            timerId = system.runTimeout(() => {
                if (!cbStack) throw new Error("Timer Already Expired")
                cbStack.forEach(x => x())
            }, Math.max(endTime - currentTime, 0))

            return this
        },

        dispose() {
            if (timerId !== undefined) system.clearRun(timerId)
        },

        getRemaining() {
            const currentTime = system.currentTick
            return {
                get ticks() {
                    if (startTime === null) return targetTimeInTicks
                    return Math.max(0, endTime! - currentTime)
                },

                get seconds() {
                    if (startTime === null) return (targetTimeInTicks / 20).toFixed(2)
                    return (Math.max(0, endTime! - currentTime) / 20).toFixed(2)
                }
            }
        },

        onTimeDown(callback: () => any) {
            if (!cbStack) throw new Error("Timer Already Expired")
            cbStack.push(callback)
        }
    }
}
