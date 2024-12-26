import { BlockVolume, GameMode, Player, system } from "@minecraft/server";
import { GameEventData, GamemodeExport } from "../gamemodeTypes";
import { useCountdown } from "../../hooks/useCountdown";
import { dim, endRound } from "../../main";
import { useLoadingTimer } from "../../utils";
import { useMinefieldDisplay } from "./minefieldDisplay";
import { VECTOR3_ZERO, Vector3Utils } from "@minecraft/math";

const minefieldFinishArea = new BlockVolume(
    {
        x: 1979,
        y: 16,
        z: -52,
    },
    {
        x: 2007,
        y: 0,
        z: -44,
    }
);

const streetOne = new BlockVolume(
    {
        x: 1982,
        y: 0,
        z: 30,
    },
    {
        x: 1990,
        y: 0,
        z: -44,
    }
);

const streetTwo = new BlockVolume(
    {
        x: 1994,
        y: 0,
        z: 30,
    },
    {
        x: 2002,
        y: 0,
        z: -44,
    }
);

const minefieldStartLocations = [
    {
        x: 1986,
        y: 1,
        z: 34,
    },
    {
        x: 1997,
        y: 3,
        z: 34,
    },
];

export async function MinefieldGameMode({
    players,
}: GameEventData): Promise<GamemodeExport> {
    const roundWinners: Player[] = [];
    const gamePlacementMap = new Map<number, Player>();
    const timer = useCountdown(60 * 20);
    let fixedPlacements: Player[] = [];
    let isActive = true;

    const display = useMinefieldDisplay({ players, timer, gamePlacementMap });

    timer.onTimeDown(() => {
        for (const player of players) {
            if (roundWinners.includes(player) || !player.isValid()) continue;
            player.sendMessage("§cYou ran out of time!");
        }
        isActive = false;
        endRound(roundWinners);
    });

    function updatePlacements() {
        fixedPlacements = fixedPlacements.filter((x) => x.isValid());

        let i = 0;
        gamePlacementMap.clear();
        fixedPlacements.forEach((player) => {
            gamePlacementMap.set(i++, player);
        });

        const arr = players
            .filter((x) => !roundWinners.includes(x) && x.isValid() && !x.isDead)
            .sort((a, b) => {
                return (
                    Vector3Utils.distance(
                        minefieldFinishArea.from,
                        a.isDead ? VECTOR3_ZERO : a.location
                    ) -
                    Vector3Utils.distance(
                        minefieldFinishArea.from,
                        b.isDead ? VECTOR3_ZERO : b.location
                    )
                );
            });

        arr.forEach((player) => {
            gamePlacementMap.set(i++, player);
        });
    }

    return {
        displayName: "Minefield",
        typeId: "rt:minefield",
        gamemodeType: "Solo",
        gameSettings: {
            gameMode: GameMode.adventure,
            deathSequence: "noRespawn",
            gameRuleSettings: {
                naturalRegeneration: false,
            },
        },
        async onceActive() {
            for (const player of players) {
                (await this).spawnPlayer(player);
                player.addEffect("blindness", 20 * 4, { showParticles: false });
            }

            system.runTimeout(() => {
                dim.fillBlocks(streetOne, "black_concrete");
                dim.fillBlocks(streetTwo, "black_concrete");

                system.runJob(
                    (function* () {
                        const itterators = [
                            streetOne.getBlockLocationIterator(),
                            streetTwo.getBlockLocationIterator(),
                        ];

                        for (const itterator of itterators) {
                            for (const location of itterator) {
                                const isMine = Math.random() < 0.5;
                                isMine && dim.setBlockType(location, "rt:explode_plate");
                                yield;
                            }
                        }
                    })()
                );
            }, 20 * 3);
            system.run(async () => {
                for (const player of players) {
                    player.setGameMode(GameMode.spectator);
                }
                await useLoadingTimer(5, players);
                for (const player of players) {
                    player.setGameMode((await this).gameSettings.gameMode);
                }

                timer.start();
            });
        },
        spawnPlayer(player) {
            const randomStartLocation =
                minefieldStartLocations[
                Math.floor(Math.random() * minefieldStartLocations.length)
                ];
            player.teleport(randomStartLocation, {
                facingLocation: minefieldFinishArea.to,
            });
        },
        whileActive() {
            updatePlacements();
            isActive && display.updateDisplay();

            for (const player of players) {
                if (
                    !minefieldFinishArea.isInside(player.location) ||
                    roundWinners.includes(player)
                )
                    continue;
                player.sendMessage("You finished the minefield!");
                player.rt.coins += 1250;
                player.setGameMode(GameMode.spectator);

                fixedPlacements.push(player);
                roundWinners.push(player);
            }

            if (
                roundWinners.length ===
                players.filter((x) => x.isValid() && !x.isDead).length
            ) {
                isActive = false;
                endRound(roundWinners);
            }
        },
        dispose() {
            timer.dispose();
        },
        onPlayerWin(player) {
            player.rt.coins += 1250;
        },
    };
}
