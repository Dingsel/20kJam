import { BlockVolume, GameMode, Player, system } from "@minecraft/server";
import { GameEventData, GamemodeExport } from "../gamemodeTypes";
import { useCountdown } from "../../hooks/useCountdown";
import { dim, endRound } from "../../main";
import { useParkourDisplay } from "./parkourDisplay";
import { VECTOR3_ZERO, Vector3Utils } from "@minecraft/math";
import { useLoadingTimer } from "../../utils";

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
    const gamePlacementMap = new Map<number, Player>()
    let fixedPlacements: Player[] = []

    const display = useParkourDisplay({ players, timer, gamePlacementMap })

    function updatePlacements() {
        fixedPlacements = fixedPlacements.filter(x => x.isValid())

        let i = 0;
        gamePlacementMap.clear()
        fixedPlacements.forEach(player => {
            gamePlacementMap.set(i++, player)
        })

        const arr = players.filter(x => !roundWinners.includes(x) && x.isValid()).sort((a, b) => {
            return (
                Vector3Utils.distance(parkourFinishArea.from, a.isDead ? VECTOR3_ZERO : a.location) -
                Vector3Utils.distance(parkourFinishArea.from, b.isDead ? VECTOR3_ZERO : b.location)
            )
        })

        arr.forEach(player => {
            gamePlacementMap.set(i++, player)
        })
    }

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
            system.run(async () => {
                await useLoadingTimer(5, players)
                timer.start()
            })
        },
        spawnPlayer(player) {
            player.teleport(parkourStartLocation, { facingLocation: parkourFinishArea.from })
        },
        whileActive() {
            updatePlacements()
            display.updateDisplay()
            for (const player of players) {
                if (
                    !player.isValid() ||
                    !parkourFinishArea.isInside(player.location) ||
                    roundWinners.includes(player) ||
                    player.isDead
                ) continue
                player.sendMessage("You finished the parkour!")
                player.setGameMode(GameMode.spectator)
                player.rt.coins += Math.max(1250 - roundWinners.length * 125, 100)
                fixedPlacements.push(player)
                roundWinners.push(player)
                if (roundWinners.length === players.length) {
                    endRound(roundWinners)
                }
            }
        }
    }
}