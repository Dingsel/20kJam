import { Vector3Utils } from "@minecraft/math"
import { structure } from "../../utils"

export const patternsToBuild = 1

export const buildPattern = [
    structure`buildbattle_pattern_1`,
    structure`buildbattle_pattern_2`,
    structure`buildbattle_pattern_3`,
    structure`buildbattle_pattern_4`,
    structure`buildbattle_pattern_5`,
]

export const buildBoxStructure = structure`build_box`

export const buildBattleBasePos = {
    x: 1000,
    y: 0,
    z: 1000
}

export const buildbattleMaxPos = Vector3Utils.add(buildBattleBasePos, {
    x: 64,
    y: 64,
    z: 64
})

export const buildPatternStartOffset = {
    x: 6,
    y: 4,
    z: 14
}

export const targetPatternStartOffset = {
    x: 20,
    y: 3,
    z: 12
}

export const spawnLocationOffset = {
    x: 11,
    y: 3,
    z: 11
}