import { Player, world } from "@minecraft/server";
import { useTypeWriter } from "./utils";

const voiceLineInfo: { [key: string]: string[] } = {
    "rt:pirate": [ 
        "Arrr, welcome, lad! So ye be after me treasure, eh? A fool ye must be to try me challenge! Ive scattered it everywhere! EVERYWHERE, ye hear me?! 20 thousand gold coins, ripe fer the takin but they wont be so easy to claim! So give yer best shot, cabin boy! Do yer worst... if ye can! Yarrrr!"
    ],
    "rt:mrcoconut": [
        "let me sleep",
        "get out of the sun",
        "ZZZzzzz",
        "sleeping",
        "silence",
        "you know coconuts are deadly",
        "The most deadly",
        "Coconuts kill over 150 people per year",
        "Step back",
        "i hate watermelons",
        "im on vacation",
        


    ],
}

world.afterEvents.entityHitEntity.subscribe((event) => {
    const { damagingEntity, hitEntity } = event
    if (!(damagingEntity instanceof Player)) return

    const entityVoiceLines = voiceLineInfo[hitEntity.typeId]
    if (!entityVoiceLines) return

    const voiceLine = entityVoiceLines[Math.floor(Math.random() * entityVoiceLines.length)]

    useTypeWriter(voiceLine, (str) => {
        switch (hitEntity.typeId) {
            case "rt:mrcoconut":
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