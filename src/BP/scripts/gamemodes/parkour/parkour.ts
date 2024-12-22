import { BlockVolume, GameMode, Player } from "@minecraft/server";
import { GameEventData, GamemodeExport } from "../gamemodeTypes";
import { useCountdown } from "../../hooks/useCountdown";
import { endRound } from "../../main";

const parkourFinishArea = new BlockVolume(
    {
        x: 0,
        y: -1,
        z: 0
    },
    {
        x: 1,
        y: -1,
        z: 1
    }
)

const parkourStartLocation = {
    x: 15,
    y: 0,
    z: 0
}

export async function ParkourGameMode({ players }: GameEventData): Promise<GamemodeExport> {
    const roundWinners: Player[] = []
    const timer = useCountdown(60 * 20)

    timer.onTimeDown(() => {
        for (const player of players) {
            if (
                roundWinners.includes(player) ||
                !player.isValid()
            ) continue
            player.sendMessage("§cYou ran out of time!")
        }
        endRound(roundWinners)
    })

    return {
        displayName: "Parkour",
        typeId: "rt:parkour",
        gamemodeType: "Solo",
        gameSettings: {
            gameMode: GameMode.adventure,
            deathSequence: "timedRespawn"
        },
        spawnPlayer(player) {
            player.teleport(parkourStartLocation)
        },
        whileActive() {
            for (const player of players) {
                if (!parkourFinishArea.doesLocationTouchFaces(player.location)) continue
                player.sendMessage("You finished the parkour!")
                roundWinners.push(player)
            }
        }
    }
}