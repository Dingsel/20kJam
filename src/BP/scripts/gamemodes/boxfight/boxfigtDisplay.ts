import { Player } from "@minecraft/server";
import { DisplayHandler } from "../../display/displayHandler";
import { Countdown } from "../../hooks/useCountdown";

export class BoxfightDisplayHandler extends DisplayHandler {
    private teamMap: Map<Player, { teamId: number; }>;
    private timer: Countdown;

    private playerAliveComponents: string[] = [];

    constructor(players: Player[], teamMap: Map<Player, { teamId: number }>, timer: Countdown) {
        super(players);
        this.teamMap = teamMap;
        this.timer = timer;
    }

    private updateAliveStatus(): void {
        const playerAliveComponentsTemplate = Array.from({ length: 8 }, () => `PLN${",".repeat(17)}`)

        let offset1 = 0;
        let offset2 = 0;

        this.teamMap.forEach(({ teamId }, player) => {
            const liveStatusPrefix = player.isDead ? "PLD" : "PLA";
            const paddedName = player.name.padEnd(17, ",");

            if (teamId === 0) {
                playerAliveComponentsTemplate[offset1] = `${liveStatusPrefix}${paddedName}`;
                offset1++;
            } else {
                playerAliveComponentsTemplate[offset2 + 4] = `${liveStatusPrefix}${paddedName}`;
                offset2++;
            }
        })

        this.playerAliveComponents = playerAliveComponentsTemplate;
    }

    public getDisplayText(): string {
        this.updateAliveStatus();

        const timeInSec = this.timer.getRemaining().seconds;
        const minutes = Math.floor(Number(timeInSec) / 60).toString().padStart(2, "0");
        const remainingSeconds = Math.floor(Number(timeInSec) % 60).toString().padStart(2, "0");

        return `TMR${minutes}:${remainingSeconds}` + this.playerAliveComponents.join("")
    }
}

export function useBoxfightDisplay({ players, teamMap, timer }: { players: Player[], teamMap: Map<Player, { teamId: number }>, timer: Countdown }) {
    return new BoxfightDisplayHandler(players, teamMap, timer)
}