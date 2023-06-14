import Fastify from "fastify"
import path from "path"
import { fileURLToPath } from 'url';
import fastifyStatic from "@fastify/static"

const server = new Fastify({ logger: true })

server.register(fastifyStatic, {
    root: path.join(path.dirname(fileURLToPath(import.meta.url)), 'public'),
})

server.get('/', (request, reply) => {
    reply.sendFile('index.html')
})
server.get('/config', (request, reply) => {
    reply.sendFile('config/config.json')
})
server.get('/seed', (request, reply) => {
    reply.sendFile('config/seed.json')
})

server.listen({ port: 3000 }, (err, address) => {
    if (err) {
        server.log.error(err)
    }
})