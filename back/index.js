import Fastify from "fastify"
import fastifyMysql from "@fastify/mysql"
import fastifyEnv from "@fastify/env"
import fastifyFormbody from "@fastify/formbody"
import routes from "./routes.js"
import fs from "fs"

const http = new Fastify({
    logger: true,
})

// PROD
// const https = new Fastify({ 
//     logger: true,
//     https: {
//         key: fs.readFileSync('/etc/letsencrypt/live/monarbrevirtuel.com/privkey.pem'),
//         cert: fs.readFileSync('/etc/letsencrypt/live/monarbrevirtuel.com/fullchain.pem')
//     }
// })

// DEV
const https = new Fastify({
    logger: true,
    https: {
        key: fs.readFileSync('certificates/privkey.pem'),
        cert: fs.readFileSync('certificates/fullchain.pem')
    }
})

const env = {
    schema: {
        type: 'object',
        required: ['PORT'],
        properties: {
            PORT: {
                type: 'string',
                default: process.env.PORT || 80
            }
        }
    },
    dotenv: true
}

const startHttp = async () => {
    // HTTP redirects to HTTPS
    http.get('*', (request, reply) => {
        const url = `https://${request.headers.host}${request.raw.url}`
        reply.redirect(301, url)
    })

    http.listen({ port: 80, host: "0.0.0.0" }, (err, address) => {
        if (err) {
            http.log.error(err)
        }
    })
}

const startHttps = async () => {
    await https.register(fastifyEnv, env)

    https.register(fastifyMysql, {
        connectionString: process.env.DB_URL
    })
    https.register(fastifyFormbody)
    https.register(routes)

    https.listen({ port: 443, host: "0.0.0.0" }, (err, address) => {
        if (err) {
            https.log.error(err)
        }
    })
}

startHttp()
startHttps()
