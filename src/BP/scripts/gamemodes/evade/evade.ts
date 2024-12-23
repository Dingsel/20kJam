import { Vector3Utils } from "@minecraft/math";
import { GameEventData, GamemodeExport } from "../gamemodeTypes";
import { useCountdown } from "../../hooks/useCountdown";
import { dim, endRound } from "../../main";
import { GameMode } from "@minecraft/server";

const { start, end } = {
    start: {
        x: 88, y: -59, z: -7
    },
    end: {
        x: 88 + 25, y: -59, z: -7 + 25
    }
}

const mapDeltaSize = Vector3Utils.subtract(end, start)
const middleLocation = Vector3Utils.add(start, Vector3Utils.scale(Vector3Utils.subtract(start, end), 0.5))


function spawnAnvils() {
    for (let i = 0; i < 60; i++) {
        const randX = Math.floor(Math.random() * mapDeltaSize.x)
        const randZ = Math.floor(Math.random() * mapDeltaSize.z)

        const targetLocation = Vector3Utils.add(
            start,
            {
                x: randX,
                y: 15,
                z: randZ
            }
        )
        dim.spawnEntity("rt:falling_anvil", targetLocation)
    }
}


export async function EvadeGameMode({ players }: GameEventData): Promise<GamemodeExport> {
    const timer = useCountdown(60 * 20)
    let gameActiveTime = 0;

    timer.onTimeDown(() => {
        endRound(players.filter(x => !x.isDead))
    })

    return {
        displayName: "Evade",
        typeId: "rt:evade",
        gamemodeType: "Solo",
        gameSettings: {
            gameMode: GameMode.adventure,
            deathSequence: "noRespawn"
        },
        spawnPlayer(player) {
            player.teleport(middleLocation)
        },

        whileActive() {
            spawnAnvils()

            gameActiveTime++

            if (gameActiveTime % 20 === 0) {
                players.forEach((p) => {
                    if (!p.isValid() || p.isDead) return
                    p.rt.coins += 50
                })
            }
        },

        async onceActive() {
            for (const player of players) {
                (await this).spawnPlayer(player)
            }
        },

        dispose() {
            timer.dispose()
        },
    }
}