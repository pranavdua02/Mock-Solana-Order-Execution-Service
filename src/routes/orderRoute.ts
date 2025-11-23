import { FastifyInstance } from 'fastify';
import { submitMarketOrder } from '../services/orderService';
import { OrderStream } from '../websocket/orderStream';
import { z } from 'zod';

export const registerOrderRoutes = async (app: FastifyInstance, stream: OrderStream) => {
  app.route({
    method: ['POST', 'GET'],
    url: '/api/orders/execute',
    handler: async (request, reply) => {
      if (request.method === 'GET') {
        return reply
          .status(400)
          .send({ error: 'Upgrade Required', message: 'Use WebSocket upgrade for status streaming.' });
      }

      const body = request.body as any;
      const result = await submitMarketOrder({
        orderType: 'market',
        baseMint: body?.baseMint,
        quoteMint: body?.quoteMint,
        side: body?.side,
        amount: Number(body?.amount),
        slippageBps: Number(body?.slippageBps ?? 250),
      });

      return reply.status(202).send(result);
    },
    wsHandler: (connection, request) => {
      const schema = z.object({
        orderId: z.string().uuid(),
      });

      const parsed = schema.safeParse(request.query);
      if (!parsed.success) {
        connection.socket.send(
          JSON.stringify({
            status: 'failed',
            error: 'orderId query param (uuid) is required before streaming',
          }),
        );
        connection.socket.close(1008, 'Invalid orderId');
        return;
      }

      stream.register(parsed.data.orderId, connection);
      connection.socket.send(
        JSON.stringify({
          status: 'pending',
          detail: { message: 'WebSocket subscription registered' },
        }),
      );
    },
  });
};


