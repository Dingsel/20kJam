import { GameMode, Player, system, world } from "@minecraft/server";
import { activeGamemode } from "./main";
import { titleCountdown } from "./utils";

world.afterEvents.playerSpawn.subscribe(async (event) => {
  const { initialSpawn, player } = event;
  if (initialSpawn) return;

  switch (activeGamemode?.gameSettings.deathSequence) {
    case "instantRespawn":
      activeGamemode.spawnPlayer(player);
      break;

    case "noRespawn":
      player.isDead = true;
      player.setGameMode(GameMode.spectator);
      break;

    case "timedRespawn":
      player.isDead = true;
      player.setGameMode(GameMode.spectator);
      await titleCountdown(5, [player]);
      player.isDead = false;
      if (!player.isValid() || activeGamemode === null) return;
      player.setGameMode(activeGamemode.gameSettings.gameMode);
      activeGamemode.spawnPlayer(player);
      break;
  }
});

system.runInterval(() => {
  const players = world.getAllPlayers()
    .filter(
      (x) =>
        x.isDead && activeGamemode?.gameSettings.deathSequence === "noRespawn"
    );
  for (const player of players) {
    player.sendMessage("RTKJAM:stext" + "§cYou are §4Dead");
  }
}, 20);

/* world.afterEvents.entityHitEntity.subscribe((event) => {
    const { damagingEntity, hitEntity } = event
    if (
        !(damagingEntity instanceof Player) ||
        !(hitEntity instanceof Player)
    ) return
}) */
