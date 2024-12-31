import { Player, system, world } from "@minecraft/server";
import { useTypeWriter } from "./utils";

const pirateTexts = [
    "Arrr, welcome, lad!\nSo ye be after me treasure, eh?",
    "A fool ye must be to try me challenge! Ive scattered it EVERYWHERE, ye hear me ?!",
    "Twenty thousand gold coins, ripe fer the takin but they wont be so easy to claim!",
    "So give yer best shot, cabin boy! Do yer worst... if ye can! Yarrrr!"
]

const voiceLineInfo: { [key: string]: string[] } = {
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
        "im on vacation"
    ],
}

world.afterEvents.entityHitEntity.subscribe(async (event) => {
    const { damagingEntity, hitEntity } = event
    if (!(damagingEntity instanceof Player)) return

    const entityVoiceLines = voiceLineInfo[hitEntity.typeId]
    if ((!entityVoiceLines && hitEntity.typeId !== "rt:pirate") || damagingEntity.inDialouge) return

    const voiceLine = hitEntity.typeId === "rt:pirate" ? "" : entityVoiceLines[Math.floor(Math.random() * entityVoiceLines.length)]
    damagingEntity.inDialouge = true

    switch (hitEntity.typeId) {
        case "rt:mrcoconut":
            useTypeWriter(voiceLine, (str, isSkippable) => {
                !isSkippable && damagingEntity.playSound("rt:doung", { pitch: 1 + Math.random() * 0.6 - 0.3 })
                damagingEntity.onScreenDisplay.setActionBar(`speach_coconut${str}`)

            }, { timeoutDuration: 2, skippedCharacters: [" "], onComplete() { damagingEntity.inDialouge = false } })
            break

        case "rt:pirate":
            damagingEntity.playSound("rt:random.pirate")

            for (const text of pirateTexts) {
                await new Promise<void>((res) => {
                    useTypeWriter(text, (str, isSkippable) => {
                        !isSkippable && damagingEntity.playSound("random.click", { pitch: 2.5 + Math.random() * 2 - 1 })
                        damagingEntity.onScreenDisplay.setActionBar(`speach_pirate${str}`)
                    }, { onComplete() { res() }, skippedCharacters: [" "], timeoutDuration: 1 })
                })

                await system.waitTicks(60)
            }

            damagingEntity.inDialouge = false
            break
    }
})