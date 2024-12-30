import { Player } from "@minecraft/server";
import { DisplayHandler } from "../../display/displayHandler";
import { Countdown } from "../../hooks/useCountdown";

class RuneCollectorDisplay extends DisplayHandler {
    private timers: Map<Player, Countdown>;

    constructor(players: Player[], timers: Map<Player, Countdown>) {
        super(players);
        this.timers = timers;
    }

    public getDisplayText(player: Player): string {
        const timer = this.timers.get(player);
        if (!timer) return "";

        const timeInSec = timer.getRemaining().seconds;
        const minutes = Math.floor(Number(timeInSec) / 60).toString().padStart(2, "0");
        const remainingSeconds = Math.floor(Number(timeInSec) % 60).toString().padStart(2, "0");

        return `BLDTMR${minutes}:${remainingSeconds}TMR2/2`
    }
}

export function useRuneCollectorDisplay({ players, timers }: { players: Player[], timers: Map<Player, Countdown> }) {
    return new RuneCollectorDisplay(players, timers)
}