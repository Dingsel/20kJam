import { Player } from "@minecraft/server";
import { DisplayHandler } from "../../display/displayHandler";
import { Countdown } from "../../hooks/useCountdown";

function getTextFromPosition(position: number): string {
    switch (position) {
        case 0:
            return "1st";
        case 1:
            return "2nd";
        case 2:
            return "3rd";
        default:
            return `${position}th`;
    }
}

class ParkourDisplay extends DisplayHandler {
    private gamePlacementMap: Map<number, Player>;
    private timer: Countdown;

    constructor(players: Player[], gamePlacementMap: Map<number, Player>, timer: Countdown) {
        super(players);
        this.gamePlacementMap = gamePlacementMap;
        this.timer = timer;
    }

    public getDisplayText(player: Player): string {
        const timeInSec = this.timer.getRemaining().seconds;
        const minutes = Math.floor(Number(timeInSec) / 60).toString().padStart(2, "0");
        const remainingSeconds = (Number(timeInSec) % 60).toString().padStart(2, "0");

        const player1String = (this.gamePlacementMap.get(0)?.name ?? "").padEnd(17, ",");
        const player2String = (this.gamePlacementMap.get(1)?.name ?? "").padEnd(17, ",");
        const player3String = (this.gamePlacementMap.get(2)?.name ?? "").padEnd(17, ",");

        const currentPosition = [...this.gamePlacementMap.values()].findIndex(x => x === player);

        return `RACTMR${minutes}:${remainingSeconds}P${player1String}P${player2String}P${player3String}TMR${getTextFromPosition(currentPosition)}`
    }
}

export function useParkourDisplay({ players, gamePlacementMap, timer }: { players: Player[], gamePlacementMap: Map<number, Player>, timer: Countdown }) {
    return new ParkourDisplay(players, gamePlacementMap, timer)
}