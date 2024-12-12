import { GameMode, world } from "@minecraft/server";
import { activeGamemode } from "./main";
import { titleCountdown } from "./utils";

world.afterEvents.playerSpawn.subscribe(async (event) => {
    const { initialSpawn, player } = event
    if (initialSpawn) return

    switch (activeGamemode?.gameSettings.deathSequence) {
        case "instantRespawn":
            activeGamemode.spawnPlayer(player)

        case "noRespawn":
            player.setGameMode(GameMode.spectator)
            break;

        case "timedRespawn":
            player.setGameMode(GameMode.spectator)
            await titleCountdown(5, player)
            activeGamemode.spawnPlayer(player)

    }
})