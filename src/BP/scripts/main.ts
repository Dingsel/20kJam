console.warn("[cmca] If You See This, You Managed To Setup The Boilerplate. Happy Coding! ")

import { world } from "@minecraft/server"
import { ActionFormData } from "@minecraft/server-ui"

world.getAllPlayers().forEach(player => {   
const ui = new ActionFormData()
.title('RT20K.intro')
.button('')
.show(player)
})