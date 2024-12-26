import { MolangVariableMap, Vector3 } from "@minecraft/server"

type ParticleSpawnable = { spawnParticle: (effectName: string, location: Vector3, molangVariables?: MolangVariableMap) => void }
type ParticleVars = { [key: string]: number }

interface ParticleSpawnOptions<T extends ParticleVars> {
    dynamicParticleVars?: Partial<T>,
    carrier: ParticleSpawnable,
    location: Vector3
}

interface ParticleSpawner<T extends ParticleVars> {
    spawn: (particleSpawnOptions: ParticleSpawnOptions<T>) => void
}

export function particleFactory<T extends ParticleVars>(particleTypeId: string, initialParticleVars?: T): ParticleSpawner<T> {
    if (!initialParticleVars) return {
        spawn({ carrier, location, dynamicParticleVars }) {
            if (dynamicParticleVars) throw new TypeError("Cannot Use Dynamic Particle Vars On A Particle Without Particle Vars.")
            carrier.spawnParticle(particleTypeId, location);
        }
    }

    const map = new MolangVariableMap()

    function updateParticleVars(particleVars: Partial<T>) {
        Object.entries(particleVars).forEach(([key, value]) => {
            map.setFloat(`variable.${key}`, value);
        })
    }

    updateParticleVars(initialParticleVars);

    return {
        spawn({ carrier, location, dynamicParticleVars }) {
            if (dynamicParticleVars) updateParticleVars(dynamicParticleVars);
            carrier.spawnParticle(particleTypeId, location, map);
        }
    }
}