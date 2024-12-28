import { Player } from "@minecraft/server";
import { DisplayHandler } from "../../display/displayHandler";
import { PlayerMapSettings } from "./pregame";
import { Countdown } from "../../hooks/useCountdown";

class BuildBattleDisplay extends DisplayHandler {
    private playerMapSettings: Map<Player, PlayerMapSettings>;
    private timer: Countdown;

    constructor(players: Player[], playerMapSettings: Map<Player, PlayerMapSettings>, timer: Countdown) {
        super(players);
        this.playerMapSettings = playerMapSettings;
        this.timer = timer;
    }

    public getDisplayText(player: Player): string {
        const info = this.playerMapSettings.get(player);
        if (!info) return "";

        const timeInSec = this.timer.getRemaining().seconds;
        const minutes = Math.floor(Number(timeInSec) / 60).toString().padStart(2, "0");
        const remainingSeconds = Math.floor(Number(timeInSec) % 60).toString().padStart(2, "0");

        const progress = info.patternOrder.length

        return `BLDTMR${minutes}:${remainingSeconds}TMR${2 - progress}/2`
    }
}

export function useBuildBattleDisplay({ players, playerMapSettings, timer }: { players: Player[], playerMapSettings: Map<Player, PlayerMapSettings>, timer: Countdown }) {
    return new BuildBattleDisplay(players, playerMapSettings, timer)
}