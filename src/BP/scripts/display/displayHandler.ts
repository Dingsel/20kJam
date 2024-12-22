import { Player } from "@minecraft/server";

export class DisplayHandler {
    protected players: Player[];

    constructor(player: Player[]) {
        this.players = player;
    }

    public getDisplayText(): string {
        return ""
    }

    public updateDisplay(): void {
        this.players.forEach(player => player.onScreenDisplay.setTitle(this.getDisplayText()))
    }
}