import { BlockVolume, GameMode, Player, system } from "@minecraft/server";
import { GameEventData, GamemodeExport } from "../gamemodeTypes";
import { useCountdown } from "../../hooks/useCountdown";
import { dim, endRound } from "../../main";
import { useParkourDisplay } from "./parkourDisplay";
import { VECTOR3_ZERO, Vector3Utils } from "@minecraft/math";
import { useLoadingTimer } from "../../utils";
import { playerKillParticle } from "../../commonParticles";

async function useCamera(player: Player) {
    player.camera.setCamera("minecraft:free", { rotation: { x: 20, y: 0 }, location: { x: 3012, y: 15, z: 10 } })
    player.camera.setCamera("minecraft:free", { rotation: { x: 0, y: 0 }, location: { x: 3012, y: 14, z: 20 }, easeOptions: { easeTime: 5 } })

    for (let i = 0; i < 5; i++) {
        player.onScreenDisplay.setActionBar('§aBe the first to finish the parkour!')
        await system.waitTicks(20)
    }

    player.camera.clear()
}

const parkourFinishArea = new BlockVolume(
    {
        x: 3006,
        y: 15,
        z: 121,
    },
    {
        x: 3017,
        y: 9,
        z: 111,
    }
);

const parkourStartLocation = {
    x: 3013,
    y: 13,
    z: -1,
};

export async function ParkourGameMode({
    players,
}: GameEventData): Promise<GamemodeExport> {
    const roundWinners: Player[] = [];
    const timer = useCountdown(120 * 20);
    const gamePlacementMap = new Map<number, Player>();
    let fixedPlacements: Player[] = [];

    const display = useParkourDisplay({ players, timer, gamePlacementMap });

    function updatePlacements() {
        fixedPlacements = fixedPlacements.filter((x) => x.isValid());

        let i = 0;
        gamePlacementMap.clear();
        fixedPlacements.forEach((player) => {
            gamePlacementMap.set(i++, player);
        });

        const arr = players
            .filter((x) => !roundWinners.includes(x) && x.isValid())
            .sort((a, b) => {
                return (
                    Vector3Utils.distance(
                        parkourFinishArea.from,
                        a.isDead ? VECTOR3_ZERO : a.location
                    ) -
                    Vector3Utils.distance(
                        parkourFinishArea.from,
                        b.isDead ? VECTOR3_ZERO : b.location
                    )
                );
            });

        arr.forEach((player) => {
            gamePlacementMap.set(i++, player);
        });
    }

    timer.onTimeDown(() => {
        for (const player of players) {
            if (roundWinners.includes(player) || !player.isValid()) continue;
            player.sendMessage("§cYou ran out of time!");
        }
        endRound(roundWinners);
    });

    return {
        displayName: "Parkour",
        typeId: "rt:parkour",
        gamemodeType: "Solo",
        gameSettings: {
            gameMode: GameMode.adventure,
            deathSequence: "timedRespawn",
        },
        async onceActive() {
            system.run(async () => {

                for (const player of players) {
                    (await this).spawnPlayer(player);
                    player.setGameMode(GameMode.spectator);

                    system.runTimeout(() => {
                        useCamera(player);
                    }, 20 * 5)
                }

                await useLoadingTimer(5, players);

                for (const player of players) {
                    player.setGameMode((await this).gameSettings.gameMode);
                }

                timer.start();
            });
        },
        async spawnPlayer(player) {
            player.setSpawnPoint({ dimension: dim, ...parkourStartLocation });
            player.teleport(parkourStartLocation, {
                facingLocation: parkourFinishArea.from,
            });
            await system.waitTicks(100)
        },
        whileActive() {
            updatePlacements();

            for (const player of roundWinners) {
                if (!player.isValid()) continue;
                player.sendMessage("RTKJAM:stext" + "§eYou are §6Finished");
            }

            display.updateDisplay();
            for (const player of players) {
                if (
                    !player.isValid() ||
                    !parkourFinishArea.isInside(player.location) ||
                    roundWinners.includes(player) ||
                    player.isDead
                )
                    continue;
                player.sendMessage("You finished the parkour!");
                player.setGameMode(GameMode.spectator);

                playerKillParticle.spawn({
                    carrier: player.dimension,
                    location: player.location,
                    dynamicParticleVars: {
                        r: 255,
                        g: 255,
                        b: 255
                    }
                })

                player.rt.coins += Math.max(1250 - roundWinners.length * 125, 100);
                fixedPlacements.push(player);
                roundWinners.push(player);
                if (roundWinners.length === players.length) {
                    endRound(roundWinners);
                }
            }
        },
        dispose() {
            timer.dispose();
        },
    };
}
