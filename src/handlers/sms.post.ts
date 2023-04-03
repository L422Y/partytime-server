import { Server } from "socket.io"
import process from "process"
import * as dotenv from "dotenv"
import { PartytimeData } from "@/types"

dotenv.config()

const numberMap: { [key: string]: string } = JSON.parse(process.env.NUMBER_MAP || "{}")
const helpCommandResponse = `<Response><Message>Commands:\n? - help\n1-10 - vote</Message></Response>`

export const smsPostHandler = (req: any, server: Server, dataBank: PartytimeData) => {
  const accountEmail = numberMap[req.body?.To]
  const cleanBody = req.body?.Body.trim()
  if (server) {
    const command = cleanBody.toLowerCase()
    const numCommand = parseInt(command)

    // Set default response
    let response = "Invalid command... try ? for help"

    switch (true) {
      // Handle Help
      case ( command === "?" ):
        return helpCommandResponse
      // Handle Numeric Vote
      case ( Number.isInteger(numCommand) && numCommand > 0 && numCommand < 21 ):
        response = setVote(accountEmail, server, req.body.From, numCommand, dataBank)
        break
      default:
        break
    }
    return `<Response><Message>${response}</Message></Response>`
  } else {
    return `<Response><Message>Invalid command... try ? for help</Message></Response>`
  }
}


export const setVote = (accountEmail: string, server: Server, from: string, vote: number, databank: PartytimeData) => {
  if (!databank.currentQueue?.queue[vote - 1]?.id) return `Invalid vote: ${vote}`
  databank.votes[from] = databank.currentQueue?.queue[vote - 1].id
  if (server) {
    server.emit("newVote", {uid: from, body: vote})
  }
  return `Vote received: ${databank.currentQueue?.queue[vote - 1].name}`
}
