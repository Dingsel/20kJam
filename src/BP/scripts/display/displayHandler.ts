import { Player } from "@minecraft/server";

export class DisplayHandler {
    protected players: Player[];

    constructor(player: Player[]) {
        this.players = player;
    }

    public getDisplayText(player: Player): string {
        return ""
    }

    public updateDisplay(): void {
        this.players.forEach(player => {
            if (!player.isValid()) return
            player.onScreenDisplay.setTitle(this.getDisplayText(player))
        })
    }
}