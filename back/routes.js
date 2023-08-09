import crypto from "crypto"
import fs from "fs"
import Stripe from 'stripe'
import nodemailer from "nodemailer"

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'monarbrevirtuel@gmail.com',
        pass: 'ppmaquyhxlaiqkif'
    },
    tls: {
        rejectUnauthorized: false
    }
})

export default async function routes(server, options) {
    // INDEX
    server.get('/', (request, reply) => {
        const html = fs.readFileSync('front/views/create.html')
        reply.header('Content-Type', 'text/html').send(html)
    })

    // CGV
    server.get('/cgv', (request, reply) => {
        try {
            const html = fs.readFileSync('front/views/cgv.html')

            reply.header('Content-Type', 'text/html').send(html)
        } catch (err) {
            reply.send(err)
        }
    })

    // Mentions légales
    server.get('/mentions', (request, reply) => {
        try {
            const html = fs.readFileSync('front/views/mentions.html')

            reply.header('Content-Type', 'text/html').send(html)
        } catch (err) {
            reply.send(err)
        }
    })

    // CHECKOUT - Process
    server.post('/checkout', async (request, reply) => {
        const stripe = new Stripe(process.env.STRIPE_API_KEY)
        const { name, date, email } = request.body

        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price: process.env.STRIPE_PRODUCT_KEY,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            customer_email: email,
            success_url: `http://${process.env.HOST_NAME}/checkout-success?name=${name}&date=${date}&email=${email}`,
            cancel_url: `http://${process.env.HOST_NAME}/`,
        })

        reply.redirect(303, session.url);
    })

    // CHECKOUT - Success
    server.get('/checkout-success', (request, reply) => {
        const { name, date, email } = request.query

        try {
            const toHash = name + date
            const hash = crypto.createHash('md5').update(toHash).digest('hex')
            const datetime = new Date(date).toISOString().slice(0, 19).replace('T', ' ')

            server.mysql.query(
                'INSERT INTO seeds ( name, planted, hash ) VALUES (?, ?, ?)',
                [name, datetime, hash],
                (err, result) => {
                    if (err)
                        reply.send(err)
                    else {
                        const payload = {
                            from: 'monarbrevirtuel@gmail.com',
                            to: email,
                            subject: 'Confirmation de votre commande sur MonArbreVirtuel.com',
                            text: `Cher.e client.e,

                            Nous tenons à vous remercier chaleureusement pour votre commande sur MonArbreVirtuel.com.
                            
                            Voici un récapitulatif de votre commande :
                            
                                Nom de l'arbre : ${name}
                                Date de plantation : ${date}
                                Lien d'accès : https://www.monarbrevirtuel.com/${hash}
                                Prix : 9,90 €
                                Temps de maturité : 18 ans
                            
                            Nous sommes ravis de vous informer que le lien d'accès que nous vous avons fourni est déjà actif, et restera disponible à vie. Cela signifie que vous pourrez suivre la croissance et le développement de votre arbre virtuel à tout moment, et cela tout au long de sa vie.
                            
                            Merci encore, et si vous avez des questions ou besoin d'assistance, n'hésitez pas à nous contacter. 
                            
                            Cordialement,
                            Diane & Vincent`
                        }
                        transporter.sendMail(payload, (err, info) => {
                            if (err)
                                console.log(err)
                            else {
                                console.log('Confirmation email sent to: ' + email)
                            }
                        })
                        // TODO : add 'first_sight' param
                        reply.redirect('/' + hash)
                    }
                }
            )
        } catch (err) {
            reply.send(err)
        }
    })

    // SHOW
    server.get('/:hash', (request, reply) => {
        const { first_sight } = request.query
        // if first_sight is true, then show popup in html template
        server.mysql.query(
            'SELECT * FROM seeds WHERE hash = ?',
            [request.params.hash],
            (err, result) => {
                if (result.length === 1) {
                    try {
                        const js = fs.readFileSync(process.env.FRONT_JS)
                        const html = fs.readFileSync('front/views/index.html')
                        const config = fs.readFileSync(process.env.BACK_CONFIG)

                        const clientJs = js.toString().replace('PLACEHOLDER_NAME', result[0].name).replace('PLACEHOLDER_BIRTHDAY', result[0].planted).replace('\"PLACEHOLDER_CONFIG\"', config)
                        const clientHtml = html.toString().replace('PLACEHOLDER_APP_CODE', clientJs).replace('PLACEHOLDER_TREE_NAME', result[0].name)

                        reply.header('Content-Type', 'text/html').send(clientHtml)
                    } catch (err) {
                        reply.send(err)
                    }
                }
            }
        )
    })
}