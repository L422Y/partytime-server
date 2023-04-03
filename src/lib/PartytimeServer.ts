import express, { Express } from "express"
import { Server } from "socket.io"
import * as dotenv from "dotenv"
import * as http from "http"
import process from "process"
import { smsPostHandler } from "@/handlers/sms.post"
import { PartytimeData } from "@/types"

dotenv.config()

export class PartytimeServer {
    // Stores data for each Spotify account
    dataBanks: { [key: string]: PartytimeData }

    // Maps Twilio phone numbers to Spotify account emails
    numberMap: { [key: string]: string }

    // Port to run the server on
    port: number

    // Socket.io Servers for each Spotify account
    servers: { [key: string]: Server }

    // Express app
    app: Express | undefined

    // HTTP server
    httpServer: http.Server | undefined

    // Interval timer for sending updates to clients
    updatesTimer: NodeJS.Timer | undefined

    constructor() {
        this.dataBanks = {}
        this.servers = {}
        this.port = process.env.PORT && Number.isInteger(process.env.PORT) ? Number.parseInt(process.env.PORT) : 4246
        this.numberMap = JSON.parse(process.env.NUMBER_MAP || "{}")
        this.initExpress()
        this.initHttpServer()
        this.initSocketServers()
        this.initEndpoints()
        this.initUpdates()
    }

    /**
     * Initialized Express
     */
    initExpress() {
        this.app = express()
        this.app.use(express.json())
        this.app.use(express.urlencoded({extended: true}))
    }

    /**
     * Initialized HTTP server for Socket.io/Express
     */
    initHttpServer() {
        if (!this.app) return
        this.httpServer = http.createServer(this.app)
        this.httpServer.listen(this.port, this.listenCallback.bind(this))
    }

    /**
     * Initializes Socket.io servers for each Spotify account
     */
    initSocketServers() {
        for (const number in this.numberMap) {
            const accountEmail = this.numberMap[number]
            this.dataBanks[accountEmail] = new PartytimeData()
            console.log("🤖 Creating server for", accountEmail, number)
            const socketServer = new Server(this.httpServer, {
                transports: ["websocket", "polling"],
                path: `/${this.numberMap[number]}/`
            })

            socketServer.on("connection", (socket) => {
                socket.on("playerUpdate", (data: any) => {
                    this.dataBanks[accountEmail].currentQueue = data.currentQueue
                })
            })

            socketServer.on("connect", (socket) => {
                socket.emit("message", `welcome ${socket.id}`)
                socket.emit("votesUpdated", {data: this.dataBanks[accountEmail].votes})
                socket.emit("smsNumber", {data: number})
                socket.broadcast.emit("message", `${socket.id} joined`)
            })

            this.servers[accountEmail] = socketServer
        }
    }

    /**
     * Initialize API Endpoints
     */
    initEndpoints() {
        if (!this.app) return

        // Twilio SMS endpoint
        this.app.post("/api/sms", (req, res) => {
            const accountEmail = this.numberMap[req.body?.To]
            const server = this.servers[accountEmail]
            if (!server) {
                console.log("No socket found for", accountEmail)
                res.send(`<Response><Message>Invalid command... try ? for help</Message></Response>`)
            } else {
                res.send(smsPostHandler(req, server, this.dataBanks[accountEmail]))
            }
        })
    }

    /**
     * Initializes interval timer for sending updates to clients
     */
    initUpdates() {
        this.updatesTimer = setInterval(() => {
            // For each server, emit/broadcast an update if there are votes
            for (const accountEmail in this.servers) {
                const server = this.servers[accountEmail]
                const dataBank = this.dataBanks[accountEmail]
                if (Object.keys(dataBank.votes).length < 1) continue
                server.emit("votesUpdated", {votes: dataBank.votes})
            }
        }, 1000)

    }

    /**
     *
     */
    listenCallback() {
        console.log(`🚀 Server listening on port ${this.port}`)
    }

    /**
     * If TEST_MODE is set, this will send fake votes to the server, at TEST_MODE_RATE_MS
     */
    initTestMode() {
        if (process.env.TEST_MODE) {
            let idx = 0
            setInterval(() => {
                for (const accountEmail in this.servers) {
                    const server = this.servers[accountEmail]
                    if (server && this.dataBanks[accountEmail] && this.dataBanks[accountEmail].currentQueue?.queue && this.dataBanks[accountEmail].currentQueue?.queue?.length) {
                        const vote = `${Math.ceil(Math.sin(idx / 1000) * 12)}`
                        const body = {
                            From: `${Math.floor(Math.random() * 100)}`,
                            To: Object.values(this.numberMap).find((v) => v === accountEmail),
                            Body: vote
                        }
                        smsPostHandler({body}, server, this.dataBanks[accountEmail])
                    }
                }
                idx += 1
                if (idx > 1000) idx = 0
            }, Number.parseInt(process.env.TEST_MODE_RATE_MS || "1000") || 1000
            )
        }
    }
}
