import { Player } from "@minecraft/server";
import { BoxfightDisplayHandler } from "../boxfight/boxfigtDisplay";
import { Countdown } from "../../hooks/useCountdown";

class BouncyBoxDisplay extends BoxfightDisplayHandler { }

export function useBouncyBoxDisplay({ players, teamMap, timer }: { players: Player[], teamMap: Map<Player, { teamId: number }>, timer: Countdown }) {
    return new BouncyBoxDisplay(players, teamMap, timer)
}