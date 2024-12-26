import { ActionFormData } from "@minecraft/server-ui";
import { lockItem } from "../../utils";
import { BoxFightKit } from "./pregame";
import { ItemDurabilityComponent } from "@minecraft/server";

const arrowsSniper = lockItem("minecraft:arrow", 8);
const stoneSword = lockItem("minecraft:stone_sword");
const crossbow = lockItem("minecraft:crossbow");
const leatherHelmet = lockItem("minecraft:leather_helmet");

const shield = lockItem("minecraft:shield");
(shield.getComponent("durability") as ItemDurabilityComponent).damage = 270;
const ironSword = lockItem("minecraft:iron_sword");
const leatherBoots = lockItem("minecraft:leather_boots");
const goldenApple = lockItem("minecraft:golden_apple", 1);

const arrowsSpecialist = lockItem("minecraft:arrow", 10);
const woodenSword = lockItem("minecraft:wooden_sword");
const bow = lockItem("minecraft:bow");
const leatherChest = lockItem("minecraft:leather_chestplate");

const leatherleg = lockItem("minecraft:leather_leggings");
const stoneAxe = lockItem("minecraft:stone_axe");

const chainBoots = lockItem("minecraft:chainmail_boots");
const snowball = lockItem("minecraft:snowball", 10);

export const kits: BoxFightKit[] = [
  {
    displayName: "Sniper",
    typeId: "sniper",
    kitItems: {
      Offhand: arrowsSniper,
      Head: leatherHelmet,
      items: [
        {
          item: stoneSword,
          slot: 0,
        },
        {
          item: crossbow,
          slot: 1,
        },
      ],
    },
  },
  {
    displayName: "Tank",
    typeId: "tank",
    kitItems: {
      Offhand: shield,
      Feet: leatherBoots,
      items: [
        {
          item: ironSword,
          slot: 0,
        },
        {
          item: goldenApple,
          slot: 1,
        },
      ],
    },
  },
  {
    displayName: "Specialist",
    typeId: "specialist",
    kitItems: {
      Offhand: arrowsSpecialist,
      Chest: leatherChest,
      items: [
        {
          item: woodenSword,
          slot: 0,
        },
        {
          item: bow,
          slot: 1,
        },
      ],
    },
  },
  {
    displayName: "Allrounder",
    typeId: "allrounder",
    kitItems: {
      Chest: leatherChest,
      Legs: leatherleg,
      items: [
        {
          item: stoneAxe,
          slot: 0,
        },
      ],
    },
  },
  {
    displayName: "Warrior",
    typeId: "warrior",
    kitItems: {
      Head: leatherHelmet,
      Feet: chainBoots,
      items: [
        {
          item: stoneSword,
          slot: 0,
        },
        {
          item: snowball,
          slot: 1,
        },
      ],
    },
  },
];

export const kitForm = new ActionFormData();
kitForm.title("RT20K.kits");

kitForm.body("");
kitForm.button('Stone Sword', 'textures/items/stone_sword');
kitForm.button('Crossbow', 'textures/items/crossbow_standby');
kitForm.button('Arrows §7x8', 'textures/items/arrow');
kitForm.button('Leather helmet', 'textures/items/leather_helmet');
kitForm.button('', '');
kitForm.button('Iron sword', 'textures/items/iron_sword');
kitForm.button('Shield', 'textures/entity/shield');
kitForm.button('Golden Apple', 'textures/items/apple_golden');
kitForm.button('Leather Boots', 'textures/items/leather_boots');
kitForm.button('', '');
kitForm.button('Wooden Sword', 'textures/items/wood_sword');
kitForm.button('Bow', 'textures/items/bow_standby');
kitForm.button('Leather Chestplate', 'textures/items/leather_chestplate');
kitForm.button('Arrows §7x10', 'textures/items/arrow');
kitForm.button('', '');
kitForm.button('Stone Axe', 'textures/items/stone_axe');
kitForm.button('Leather Chestplate', 'textures/items/leather_chestplate');
kitForm.button('Leather leggings', 'textures/items/leather_leggings');
kitForm.button('', '');
kitForm.button('', '');
kitForm.button('Stone Sword', 'textures/items/stone_sword');
kitForm.button('Snowball §7x10', 'textures/items/snowball');
kitForm.button('Leather helmet', 'textures/items/leather_helmet');
kitForm.button('Chain Boots', 'textures/items/chainmail_boots');