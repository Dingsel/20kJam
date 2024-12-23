import { BlockVolume, EntityProjectileComponent, GameMode, Player, system, world } from "@minecraft/server";
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
            const block = entity.dimension.tryGetBlock(targetLocation)
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

world.afterEvents.itemUse.subscribe((event) => {
    const { itemStack, source } = event
    if (itemStack.typeId !== "rt:knockback_rpg") return
    const proj = source.dimension.spawnEntity("rt:knockback_projectile", source.getHeadLocation())
    proj.applyImpulse(Vector3Utils.scale(source.getViewDirection(), 4))
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

    let platformBounds = new BlockVolume(
        {
            x: -79,
            y: -40,
            z: -76
        },
        {
            x: -107,
            y: -40,
            z: -48
        }
    )

    let currentDecreases = 0;
    dim.fillBlocks(platformBounds, "minecraft:bedrock") // Maybe even a structure?

    function decreaseMapSize() {
        currentDecreases++

        const { from, to } = platformBounds

        const newBounds = {
            from: {
                x: from.x + currentDecreases,
                y: from.y,
                z: from.z + currentDecreases
            },
            to: {
                x: to.x - currentDecreases,
                y: to.y,
                z: to.z - currentDecreases
            }
        };

        const fillAir = (bounds: BlockVolume) => {
            dim.fillBlocks(bounds, "minecraft:air")
        }

        fillAir(new BlockVolume(from, { x: newBounds.from.x, y: to.y, z: to.z }))
        fillAir(new BlockVolume({ x: newBounds.to.x, y: from.y, z: from.z }, to))
        fillAir(new BlockVolume({ x: from.x, y: from.y, z: from.z }, { x: newBounds.to.x, y: to.y, z: newBounds.from.z }))
        fillAir(new BlockVolume({ x: newBounds.from.x, y: from.y, z: newBounds.to.z }, { x: to.x, y: to.y, z: to.z }))

        return new BlockVolume(newBounds.from, newBounds.to)
    }

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

        whileActive() {
            if (3 >= currentDecreases) {
                platformBounds = decreaseMapSize()
            }
        },

        dispose() {
            system.clearRun(interval)
        },
    }
}