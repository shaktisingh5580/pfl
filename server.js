const http = require("http")
const { Server } = require("socket.io")

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" })
  res.end("Socket.io server for PFL Chat")
})

// Create Socket.io server
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict this to your domain
    methods: ["GET", "POST"],
  },
})

// Store connected users
const connectedUsers = new Map()

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  // User connects with their data
  socket.on("user:connect", (userData) => {
    console.log("User authenticated:", userData.name)

    // Store user data
    connectedUsers.set(socket.id, {
      socketId: socket.id,
      userId: userData.userId,
      name: userData.name,
    })

    // Broadcast updated user list
    broadcastUserList()
  })

  // User sends a message
  socket.on("message:send", (message) => {
    console.log("Message received:", message.text)

    // Broadcast message to all clients
    io.emit("message:receive", message)
  })

  // User disconnects
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)

    // Remove user from connected users
    connectedUsers.delete(socket.id)

    // Broadcast updated user list
    broadcastUserList()
  })

  // Explicit user disconnect (e.g., logout)
  socket.on("user:disconnect", (userData) => {
    console.log("User explicitly disconnected:", userData.userId)

    // Find and remove user
    for (const [socketId, user] of connectedUsers.entries()) {
      if (user.userId === userData.userId) {
        connectedUsers.delete(socketId)
        break
      }
    }

    // Broadcast updated user list
    broadcastUserList()
  })
})

// Broadcast updated user list to all clients
function broadcastUserList() {
  const users = Array.from(connectedUsers.values())
  io.emit("users:update", users)
}

// Start server
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`)
})

// Handle server shutdown
process.on("SIGINT", () => {
  console.log("Server shutting down")
  io.close()
  server.close()
  process.exit(0)
})
