import { Player, world } from "@minecraft/server";
import { useTypeWriter } from "./utils";

const voiceLineInfo: { [key: string]: string[] } = {
    "rt:pirate": [],
    "rt:mistercoconut": [],
}

world.afterEvents.entityHitEntity.subscribe((event) => {
    const { damagingEntity, hitEntity } = event
    if (!(damagingEntity instanceof Player)) return

    const entityVoiceLines = voiceLineInfo[hitEntity.typeId]
    if (!entityVoiceLines) return

    const voiceLine = entityVoiceLines[Math.floor(Math.random() * entityVoiceLines.length)]

    useTypeWriter(voiceLine, (str) => {
        switch (hitEntity.typeId) {
            case "rt:mistercoconut":
                damagingEntity.playSound("rt:doung", { pitch: 1 + Math.random() * 0.6 - 0.3 })
                damagingEntity.onScreenDisplay.setActionBar(`speach_coconut${str}`)
                break
            case "rt:pirate":
                damagingEntity.playSound("random.pop", { pitch: 1.2 + Math.random() * 0.6 - 0.3 })
                damagingEntity.onScreenDisplay.setActionBar(`speach_pirate${str}`)
                break

        }

    }, { timeoutDuration: 3, skippedCharacters: [" "] })
})