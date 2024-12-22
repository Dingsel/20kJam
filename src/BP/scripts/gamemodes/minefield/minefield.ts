import { BlockVolume, Player } from "@minecraft/server"
import { GameEventData, GamemodeExport } from "../gamemodeTypes"
import { useCountdown } from "../../hooks/useCountdown"
import { endRound } from "../../main"

const minefieldFinishArea = new BlockVolume(
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

const minefieldStartLocation = {
    x: 15,
    y: 0,
    z: 0
}

export async function MinefieldGameMode({ players }: GameEventData): Promise<GamemodeExport> {
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
        displayName: "Minefield",
        typeId: "rt:minefield",
        gamemodeType: "Solo",
        gameSettings: {
            deathSequence: "noRespawn"
        },
        spawnPlayer(player) {
            player.teleport(minefieldStartLocation)
        },
        whileActive() {
            for (const player of players) {
                if (!minefieldFinishArea.doesLocationTouchFaces(player.location)) continue
                player.sendMessage("You finished the minefield!")
                roundWinners.push(player)
            }

            if (roundWinners.length === players.length) {
                endRound(roundWinners)
            }
        }
    }
}