import { Player } from "@minecraft/server";
import { ParkourDisplay } from "../parkour/parkourDisplay";
import { Countdown } from "../../hooks/useCountdown";

class MinefieldDisplay extends ParkourDisplay { }

export function useMinefieldDisplay({ players, gamePlacementMap, timer }: { players: Player[], gamePlacementMap: Map<number, Player>, timer: Countdown }) {
    return new MinefieldDisplay(players, gamePlacementMap, timer)
}