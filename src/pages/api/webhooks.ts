import { NextApiResponse , NextApiRequest } from "next";
import { Readable } from "stream";
import Stripe from "stripe";
import { stripe } from '../../services/stripe';

// export default(req:NextApiRequest, res:NextApiResponse) => {
//     console.log('evento recebido')

//     res.status(200).json({ok:true})
// }


async function buffer(readable:Readable){
    const chunks = [];

    for await(const chunk of readable){
        chunks.push(
            typeof chunk == "string" ? Buffer.from(chunk) : chunk
        )
    };

    return Buffer.concat(chunks);
}

export const config = {
    api:{
        bodyParser:false
    }
}

const relevantEvents = new Set(['checkout.session.completed'])

export default async (req:NextApiRequest, res:NextApiResponse)=>{
  if( req.method == 'POST'){
    const buf = await buffer(req)
    const secret = req.headers['stripe-signature']

    let event: Stripe.Event;

    try{
        event = stripe.webhooks.constructEvent(buf,secret,process.env.STRIPE_WEBHOOK_SECRET);
    }catch(err){
        return res.status(400).send(`error webhook: ${err.message}`)
    }

    const {type} = event;

    if(relevantEvents.has(type)){
        console.log('evento recebido', event)
    }

      res.json({received:true})
  }else{
      res.setHeader("Allow", 'POST')
      res.status(405).end('Method not allowed')

  }
}