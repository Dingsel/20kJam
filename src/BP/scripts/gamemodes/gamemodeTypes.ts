type GamemodeType = "Solo" | "Team"

interface GamemodeExport {
    displayName: string
    typeId: string
    gamemodeType: GamemodeType

    onceActive?: () => void
    whileActive?: () => void
}

interface GameSettingInformation { }