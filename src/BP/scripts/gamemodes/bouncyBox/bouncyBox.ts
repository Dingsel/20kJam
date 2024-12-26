import { EntityInventoryComponent, GameMode, Player, system, world } from "@minecraft/server";
import { GameEventData, GamemodeExport } from "../gamemodeTypes";
import { splitupPlayers } from "../../hooks/splitupPlayers";
import { VECTOR3_BACK, VECTOR3_DOWN, VECTOR3_FORWARD, VECTOR3_LEFT, VECTOR3_RIGHT, VECTOR3_UP, Vector3Utils } from "@minecraft/math";
import { dim, endRound, isDev } from "../../main";
import { useBouncyBoxDisplay } from "./boncyBoxDisplay";
import { useCountdown } from "../../hooks/useCountdown";
import { lockItem, useLoadingTimer } from "../../utils";

const teamSpawnLocations = [
    {
        x: 4000,
        y: 13,
        z: -11
    },
    {
        x: 4000,
        y: 13,
        z: 12
    }
] as const

const centerLocation = {
    x: 4000,
    y: 13,
    z: 0
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
const blaster = lockItem("rt:knockback_rpg")


export async function BouncyBoxGameMode({ players }: GameEventData): Promise<GamemodeExport> {
    const { playerTeamMap } = splitupPlayers(2, players)
    const timer = useCountdown(180 * 20)
    let isActive = false;

    const display = useBouncyBoxDisplay({ players, teamMap: playerTeamMap, timer })

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
                entity.dimension.playSound("mob.wither.break_block", entity.location, { pitch: 1.5 })
                entity.lastBounceTime = system.currentTick
            }


            if (entity.typeId === "rt:knockback_projectile") {
                const playersAround = entity.dimension.getPlayers({ location: entity.location, maxDistance: 3 })
                if (playersAround.length > 0) {
                    const viewDir = entity.getViewDirection()
                    for (const player of playersAround) {
                        player.applyKnockback(viewDir.x, viewDir.z, 5, 1)
                    }
                    entity.remove()
                }
                if (entity.isValid() && entity.isOnGround && Vector3Utils.magnitude(entity.getVelocity()) < 0.1) {
                    entity.remove()
                }
            }
        }
    })

    function checkIfGameWon() {
        const alivePlayers = players.filter(x => x.isValid());
        const teams = [0, 1];

        for (const teamId of teams) {
            if (/*!isDev &&*/ !alivePlayers.some(p => playerTeamMap.get(p)?.teamId === teamId)) {
                const winningTeam = teamId === 0 ? 1 : 0;
                const winningTeamMembers = alivePlayers.filter(p => playerTeamMap.get(p)?.teamId === winningTeam)
                winningTeamMembers.forEach(p => p.rt.coins += 1000);
                endRound(winningTeamMembers);
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

    const itemUseEvent = world.afterEvents.itemUse.subscribe((event) => {
        const { itemStack, source } = event
        if (
            !players.indexOf(source) ||
            !isActive ||
            itemStack.typeId !== "rt:knockback_rpg" ||
            source.getItemCooldown("rt:knockback_rpg") > 0
        ) return

        const proj = source.dimension.spawnEntity("rt:knockback_projectile", source.getHeadLocation())
        source.playSound("mob.wither.shoot", { pitch: 1.5 })
        system.runTimeout(() => {
            source.playSound("mob.wither.shoot", { pitch: 1.3, volume: 0.5 })
        }, 3)
        source.startItemCooldown("rt:knockback_rpg", 10)
        proj.setRotation(source.getRotation())
        proj.applyImpulse(Vector3Utils.scale(source.getViewDirection(), 4))
    })

    timer.onTimeDown(() => {
        endRound([])
    })

    return {
        displayName: "Bouncy Box",
        typeId: "rt:bouncyBox",
        gamemodeType: "Team",
        gameSettings: {
            gameMode: GameMode.adventure,
            deathSequence: "noRespawn",
            gameRuleSettings: {
                fallDamage: false,
                naturalRegeneration: false
            }
        },

        async onceActive() {
            for (const [player, { teamId }] of playerTeamMap) {
                const container = (player.getComponent("inventory") as EntityInventoryComponent).container
                container?.setItem(0, blaster)

                player.teleport(
                    Vector3Utils.add(
                        teamSpawnLocations[teamId],
                        { x: Math.floor(Math.random() * 6 - 3), y: 0, z: 0 }
                    ),
                    { facingLocation: centerLocation }
                )
            }

            system.run(async () => {
                await useLoadingTimer(5, players)
                isActive = true
                timer.start()
            })
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
            system.clearRun(interval)
            world.afterEvents.entityDie.unsubscribe(killEvent)
            world.afterEvents.itemUse.unsubscribe(itemUseEvent)
        },
    }
}