import { Player } from "@minecraft/server";
import { DisplayHandler } from "../../display/displayHandler";
import { Countdown } from "../../hooks/useCountdown";

class RuneCollectorDisplay extends DisplayHandler {
    private timers: Map<Player, Countdown>;
    private playerCoinMap: Map<Player, number>;

    constructor(players: Player[], timers: Map<Player, Countdown>, playerCoinMap: Map<Player, number>) {
        super(players);
        this.timers = timers;
        this.playerCoinMap = playerCoinMap;
    }

    public getDisplayText(player: Player): string {
        const timer = this.timers.get(player);
        if (!timer) return "";

        const timeInSec = timer.getRemaining().seconds;
        const minutes = Math.floor(Number(timeInSec) / 60).toString().padStart(2, "0");
        const remainingSeconds = Math.floor(Number(timeInSec) % 60).toString().padStart(2, "0");

        //ADD COLLECTED COIN AMOUNT HERE
        return `RCLTMR${minutes}:${remainingSeconds}TMR${this.playerCoinMap.get(player)}`
    }
}

export function useRuneCollectorDisplay({ players, timers, playerCoinMap }: { players: Player[], timers: Map<Player, Countdown>, playerCoinMap: Map<Player, number> }) {
    return new RuneCollectorDisplay(players, timers, playerCoinMap)
}