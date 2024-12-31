import { Vector3Utils } from "@minecraft/math";
import { dim } from "../../main";
import { shuffleArr } from "../../utils";
import { GameEventData } from "../gamemodeTypes";
import { BlockVolume, Player, Structure, Vector3, world } from "@minecraft/server";
import { buildBattleBasePos, buildbattleMaxPos, buildBoxStructure, buildPattern, buildPatternStartOffset, patternsToBuild, spawnLocationOffset, targetPatternStartOffset } from "./staticData";

export interface PlayerMapSettings {
    patternOrder: Structure[],
    buildAreaStart: Vector3,
    spawnLocation: Vector3,
    buildPatternVolume: BlockVolume,
    targetPatternVolume: BlockVolume
}

interface BuildBattlePregame {
    playerMapSettings: Map<Player, PlayerMapSettings>,
    dispose(): void
}

export async function generateMap(game: GameEventData): Promise<BuildBattlePregame> {
    const { players } = game
    dim.runCommand(`tickingarea add ${buildBattleBasePos.x} ${buildBattleBasePos.y} ${buildBattleBasePos.z} ${buildbattleMaxPos.x} ${buildbattleMaxPos.y} ${buildbattleMaxPos.z} rt:buildbattle`)

    const patternOrder = shuffleArr([...buildPattern]).slice(0, patternsToBuild)

    const playerMapSettings = new Map<Player, PlayerMapSettings>(players.map((player, i) => {
        const row = i % 2
        const col = Math.floor(i / 2)
        const height = Math.floor(i / 4)

        const buildAreaStart = Vector3Utils.add(buildBattleBasePos, {
            x: row * 32,
            y: height * 32,
            z: col * 32
        })


        const buildPatternStart = Vector3Utils.add(buildAreaStart, buildPatternStartOffset)
        const buildPatternEnd = Vector3Utils.add(buildPatternStart, { x: 0, y: 4, z: 4 })

        const targetPatternStart = Vector3Utils.add(buildAreaStart, targetPatternStartOffset)
        const targetPatternEnd = Vector3Utils.add(targetPatternStart, { x: 0, y: 4, z: 4 })

        const buildPatternVolume = new BlockVolume(buildPatternStart, buildPatternEnd)
        const targetPatternVolume = new BlockVolume(targetPatternStart, targetPatternEnd)

        const spawnLocation = Vector3Utils.add(buildAreaStart, spawnLocationOffset)

        world.structureManager.place(buildBoxStructure, dim, buildAreaStart)
        world.structureManager.place(patternOrder[0], dim, buildPatternStart)

        return [
            player,
            {
                patternOrder,
                buildAreaStart,

                spawnLocation,
                buildPatternVolume,
                targetPatternVolume
            }
        ]
    }))

    return {
        playerMapSettings,
        dispose() {
            dim.runCommand(`tickingarea remove rt:buildbattle`)
        }
    }
}