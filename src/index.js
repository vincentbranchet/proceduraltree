import Fastify from "fastify"
import path from "path"
import { fileURLToPath } from 'url';
import fastifyStatic from "@fastify/static"
import fastifyMysql from "@fastify/mysql"
import crypto from "crypto"
import fs from "fs"
import fastifyEnv from "@fastify/env"

const server = new Fastify({ logger: true })

const env = {
    schema: {
        type: 'object',
        required: ['PORT'],
        properties: {
            PORT: {
                type: 'string',
                default: 3000
            }
        }
    },
    dotenv: true
}

const start = async () => {
    await server.register(fastifyEnv, env)

    server.register(fastifyStatic, {
        root: path.join(path.dirname(fileURLToPath(import.meta.url)), '../public'),
        prefix: '/public/'
    })
    server.register(fastifyMysql, {
        connectionString: process.env.DB_URL
    })

    server.get('/', (request, reply) => {
        reply.sendFile('index.html')
    })

    server.get('/create', {
        schema: {
            query: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    planted: { type: 'string' }
                },
                required: ['name', 'planted']

            }
        }
    }, (request, reply) => {
        const toHash = request.query.name + request.query.planted
        const hash = crypto.createHash('md5').update(toHash).digest('hex')
        const datetime = new Date(request.query.planted).toISOString().slice(0, 19).replace('T', ' ')

        server.mysql.query(
            'INSERT INTO seeds ( name, planted, hash ) VALUES (?, ?, ?)',
            [request.query.name, datetime, hash],
            (err, result) => {
                reply.send(err || result)
            }
        )
    })

    server.get('/config', (request, reply) => {
        const config = fs.readFileSync('src/config.json')

        reply.send(config)
    })

    server.get('/:hash', (request, reply) => {
        server.mysql.query(
            'SELECT * FROM seeds WHERE hash = ?',
            [request.params.hash],
            (err, result) => {
                if (result.length === 1) {
                    try {
                        // TODO : find a proper way to send seed data to client
                        fs.writeFileSync('./public/config/seed.json', JSON.stringify(
                            {
                                name: result[0].name,
                                birthday: result[0].planted
                            },
                        ), 'utf8')
                        reply.sendFile('index.html')
                    } catch (err) {
                        reply.send(err)
                    }
                }
            }
        )
    })

    server.listen({ port: 3000 }, (err, address) => {
        if (err) {
            server.log.error(err)
        }
    })
}

start()