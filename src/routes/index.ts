
import { FastifyPluginAsync } from 'fastify';

const routes: FastifyPluginAsync = async (server) => {
  server.get('/', async function () {
    return { status: 'OK' };
  });
  server.get("/health", async function () {
    return { status: "OK" };
  });
}

export default routes;
