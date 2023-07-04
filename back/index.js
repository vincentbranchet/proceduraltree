import Fastify from "fastify"
import fastifyMysql from "@fastify/mysql"
import fastifyEnv from "@fastify/env"
import fastifyFormbody from "@fastify/formbody"
import routes from "./routes.js"

const server = new Fastify({ logger: true })

const env = {
    schema: {
        type: 'object',
        required: ['PORT'],
        properties: {
            PORT: {
                type: 'string',
                default: process.env.PORT || 3000
            }
        }
    },
    dotenv: true
}

const start = async () => {
    await server.register(fastifyEnv, env)

    server.register(fastifyMysql, {
        connectionString: process.env.DB_URL
    })
    server.register(fastifyFormbody)
    server.register(routes)

    server.listen({ port: process.env.PORT, host: "0.0.0.0" }, (err, address) => {
        if (err) {
            server.log.error(err)
        }
    })
}

start()
