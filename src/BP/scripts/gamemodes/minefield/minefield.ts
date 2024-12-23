import { BlockVolume, GameMode, Player } from "@minecraft/server"
import { GameEventData, GamemodeExport } from "../gamemodeTypes"
import { useCountdown } from "../../hooks/useCountdown"
import { endRound } from "../../main"

const minefieldFinishArea = new BlockVolume(
    {
        x: 1979,
        y: 16,
        z: -52
    },
    {
        x: 2007,
        y: 0,
        z: -44
    }
)

const minefieldStartLocations = [
    {
        x: 1986,
        y: 1,
        z: 34
    },
    {
        x: 1997,
        y: 3,
        z: 34
    }
]

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
            gameMode: GameMode.adventure,
            deathSequence: "noRespawn"
        },
        async onceActive() {
            for (const player of players) {
                (await this).spawnPlayer(player)
            }
            timer.start()
        },
        spawnPlayer(player) {
            const randomStartLocation = minefieldStartLocations[Math.floor(Math.random() * minefieldStartLocations.length)]
            player.teleport(randomStartLocation, { facingLocation: minefieldFinishArea.to })
        },
        whileActive() {
            for (const player of players) {
                if (
                    !minefieldFinishArea.doesLocationTouchFaces(player.location)
                    || roundWinners.includes(player)
                ) continue
                player.sendMessage("You finished the minefield!")
                player.setGameMode(GameMode.spectator)
                roundWinners.push(player)
            }

            if (roundWinners.length === players.length) {
                endRound(roundWinners)
            }
        },
        onPlayerWin(player) {
            player.rt.coins += 1250
        },
    }
}