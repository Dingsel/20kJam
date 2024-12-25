import { GameMode, Player, system, world } from "@minecraft/server";
import { GameEventData, GamemodeExport } from "../gamemodeTypes";
import { splitupPlayers } from "../../hooks/splitupPlayers";
import { VECTOR3_BACK, VECTOR3_DOWN, VECTOR3_FORWARD, VECTOR3_LEFT, VECTOR3_RIGHT, VECTOR3_UP, Vector3Utils } from "@minecraft/math";
import { dim } from "../../main";
import { useBouncyBoxDisplay } from "./boncyBoxDisplay";
import { useCountdown } from "../../hooks/useCountdown";
import { titleCountdown } from "../../utils";

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
    const { playerTeamMap } = splitupPlayers(2, players)
    const timer = useCountdown(180 * 20)

    const display = useBouncyBoxDisplay({ players, teamMap: playerTeamMap, timer })

    function checkIfGameWon() {
        const alivePlayers = players.filter(x => x.isValid());
        const teams = [0, 1];

        for (const teamId of teams) {
            if (!alivePlayers.some(p => playerTeamMap.get(p)?.teamId === teamId)) {
                const winningTeam = teamId === 0 ? 1 : 0;
                alivePlayers
                    .filter(p => playerTeamMap.get(p)?.teamId === winningTeam)
                    .forEach(p => p.rt.coins += 1000);
            }
        }
    }

    const killEvent = world.afterEvents.entityDie.subscribe((event) => {
        const { damageSource, deadEntity } = event
        if (!(deadEntity instanceof Player)) return
        const damigingEntity = damageSource.damagingEntity /* || deadEntity.lastHitBy */
        if (!(damigingEntity instanceof Player)) return

        const deadEntityTeam = playerTeamMap.get(deadEntity)?.teamId

        playerTeamMap.forEach(({ teamId }, player) => {
            if (teamId === deadEntityTeam) return
            player.rt.coins += 125
        })
        checkIfGameWon()
    })

    return {
        displayName: "Bouncy Box",
        typeId: "rt:bouncyBox",
        gamemodeType: "Team",
        gameSettings: {
            gameMode: GameMode.adventure,
            deathSequence: "noRespawn"
        },

        async onceActive() {
            for (const [player, { teamId }] of playerTeamMap) {
                player.teleport(Vector3Utils.add(teamSpawnLocations[teamId], { x: 0, y: 0, z: Math.floor(Math.random() * 10 - 5) }))
            }

            await titleCountdown(5, players)

            timer.start()
        },

        spawnPlayer(player) {
            console.warn("This should never execute")
        },

        whileActive() {
            display.updateDisplay()
            checkIfGameWon()
        },

        dispose() {
            timer.dispose()
            world.afterEvents.entityDie.unsubscribe(killEvent)
            system.clearRun(interval)
        },
    }
}