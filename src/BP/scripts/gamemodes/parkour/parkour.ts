import { BlockVolume, GameMode, Player } from "@minecraft/server";
import { GameEventData, GamemodeExport } from "../gamemodeTypes";
import { useCountdown } from "../../hooks/useCountdown";
import { dim, endRound } from "../../main";

const parkourFinishArea = new BlockVolume(
    {
        x: 3006,
        y: 15,
        z: 121
    },
    {
        x: 3017,
        y: 9,
        z: 111
    }
)

const parkourStartLocation = {
    x: 3013,
    y: 13,
    z: -1
}

export async function ParkourGameMode({ players }: GameEventData): Promise<GamemodeExport> {
    const roundWinners: Player[] = []
    const timer = useCountdown(120 * 20)

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
        async onceActive() {
            for (const player of players) {
                (await this).spawnPlayer(player)
            }
            timer.start()
        },
        spawnPlayer(player) {
            player.teleport(parkourStartLocation, { facingLocation: parkourFinishArea.from })
        },
        whileActive() {
            for (const player of players) {
                player.setSpawnPoint({ dimension: dim, ...parkourStartLocation })
                if (
                    !parkourFinishArea.doesLocationTouchFaces(player.location) ||
                    roundWinners.includes(player)
                ) continue
                player.sendMessage("You finished the parkour!")
                player.setGameMode(GameMode.spectator)
                roundWinners.push(player)
            }
        },
        onPlayerWin(player) {
            player.rt.coins += 1250
        },
    }
}