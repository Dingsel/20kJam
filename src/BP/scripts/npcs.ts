import { Player, world } from "@minecraft/server";
import { useTypeWriter } from "./utils";

const voiceLineInfo: { [key: string]: string[] } = {
    "rt:pirate": [],
    "rt:mrcoconut": [
        "let me sleep",
        "get out of the sun",
        "ZZZzzzz",
        "*sleeping*",
        "silence",
        "you know coconuts are deadly",
        "The most deadly",
        "Coconuts kill over 150 people per year",
        "Step back",
        "i hate watermelons",
        "im on vacation"
    ],
}

world.afterEvents.entityHitEntity.subscribe((event) => {
    const { damagingEntity, hitEntity } = event
    if (!(damagingEntity instanceof Player)) return

    const entityVoiceLines = voiceLineInfo[hitEntity.typeId]
    if (!entityVoiceLines || damagingEntity.inDialouge) return

    const voiceLine = entityVoiceLines[Math.floor(Math.random() * entityVoiceLines.length)]

    damagingEntity.inDialouge = true
    useTypeWriter(voiceLine, (str, isSkippable) => {
        switch (hitEntity.typeId) {
            case "rt:mrcoconut":
                !isSkippable && damagingEntity.playSound("rt:doung", { pitch: 1 + Math.random() * 0.6 - 0.3 })
                damagingEntity.onScreenDisplay.setActionBar(`speach_coconut${str}`)
                break
            case "rt:pirate":
                !isSkippable && damagingEntity.playSound("random.pop", { pitch: 1.2 + Math.random() * 0.6 - 0.3 })
                damagingEntity.onScreenDisplay.setActionBar(`speach_pirate${str}`)
                break

        }

    }, {
        timeoutDuration: 2, skippedCharacters: [" "], onComplete() {
            damagingEntity.inDialouge = false
        },
    })
})