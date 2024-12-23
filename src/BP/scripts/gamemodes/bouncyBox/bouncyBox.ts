import { EntityProjectileComponent, GameMode, system, world } from "@minecraft/server";
import { GameEventData, GamemodeExport } from "../gamemodeTypes";
import { splitupPlayers } from "../../hooks/splitupPlayers";
import { VECTOR3_BACK, VECTOR3_DOWN, VECTOR3_FORWARD, VECTOR3_LEFT, VECTOR3_RIGHT, VECTOR3_UP, Vector3Utils } from "@minecraft/math";
import { dim } from "../../main";

const teamSpawnLocations = [
    {
        x: -103,
        y: -41,
        z: -61
    },
    {
        x: -78,
        y: -41,
        z: -61
    }
] as const

const centerLocation = {
    x: -93, y: -42, z: -63
}

const DOWN = { x: 0, y: -2, z: 0 }

const scanDirections = [
    VECTOR3_FORWARD,
    VECTOR3_BACK,
    VECTOR3_LEFT,
    VECTOR3_RIGHT,
    VECTOR3_UP,
    VECTOR3_DOWN,
    DOWN
]

const BOUNCING_BLOCK = "rt:bouncy_block"

const interval = system.runInterval(() => {

    const bouncers = [
        ...world.getAllPlayers(),
        ...dim.getEntities({ type: "rt:knockback_projectile" })
    ]

    for (const entity of bouncers) {
        if (!entity.isValid()) continue
        if ((entity.lastBounceTime ?? 0) + 10 > system.currentTick) continue

        for (const direction of scanDirections) {
            const targetLocation = Vector3Utils.add(entity.getHeadLocation(), direction)
            const block = entity.dimension.getBlock(targetLocation)
            if (block?.typeId !== BOUNCING_BLOCK) continue

            if (direction === DOWN || direction === VECTOR3_UP) {
                const pDir = entity.getViewDirection()
                entity.applyKnockback(pDir.x, pDir.z, 2, 2)
            } else {
                const dp = Vector3Utils.subtract(entity.getHeadLocation(), targetLocation)
                const normal = Vector3Utils.normalize(dp)
                const mag = Vector3Utils.magnitude(dp)

                const dirX = dp.x / mag
                const dirZ = dp.z / mag

                entity.applyKnockback(dirX, dirZ, 5, normal.y + 1)
            }

            entity.lastBounceTime = system.currentTick
        }
    }
})

world.afterEvents.projectileHitEntity.subscribe((event) => {
    const { projectile } = event
    if (projectile.typeId !== "rt:knockback_projectile") return

    const viewDir = projectile.getViewDirection()
    const hitEntity = event.getEntityHit().entity

    hitEntity?.applyKnockback(viewDir.x, viewDir.z, 5, 1)
    projectile.remove()
})

export async function BouncyBoxGameMode({ players }: GameEventData): Promise<GamemodeExport> {
    const teamData = splitupPlayers(2, players)

    return {
        displayName: "Bouncy Box",
        typeId: "rt:bouncyBox",
        gamemodeType: "Team",
        gameSettings: {
            gameMode: GameMode.adventure,
            deathSequence: "noRespawn"
        },
        spawnPlayer(player) {
        },

        dispose() {
            system.clearRun(interval)
        },
    }
}