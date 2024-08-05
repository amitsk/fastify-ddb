
import { FastifyPluginAsync } from 'fastify';

const routes: FastifyPluginAsync = async (server) => {
  server.get("/healthcheck", async function () {
    return { status: "OK" };
  });
}

export default routes;
