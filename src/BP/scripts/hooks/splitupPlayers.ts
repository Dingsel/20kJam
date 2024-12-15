import type { Player } from "@minecraft/server"
import { shuffleArr } from "../utils";

export function splitupPlayers(teamAmmount: number, splittingPlayers: Player[]) {
    const players = shuffleArr(splittingPlayers)
    const playersPerTeam = Math.floor(players.length / teamAmmount)

    //TODO: Uncoment in prod 👍
    //if (
    //    playersPerTeam <= 0 ||
    //    players.length < 4
    //) throw new Error("Not Enough People To Start The Game")

    const isUneaven = !!(players.length & 1)
    const playerTeamMap = new Map<Player, { teamId: number }>()

    for (let i = 0; i < players.length; i++) {

        const player = players[i]
        const assignedTeam = i % teamAmmount

        playerTeamMap.set(player, {
            teamId: assignedTeam
        })
    }

    return {
        playerTeamMap
    }
}