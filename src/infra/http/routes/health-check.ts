import { getUploads } from "@/app/functions/get-uploads";
import { uploadImage } from "@/app/functions/uploads-images";
import { db } from "@/infra/db";
import { schema } from "@/infra/db/schemas";
import { isRight, unwrapEither } from "@/shared/either";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

export const healthCheckRoute: FastifyPluginAsyncZod = async ( server ) => {
    server.get( "/health", {
        schema: {
            summary: "Health check ",
            tags: [ "healthCheck" ]
        }
    }, async ( request, reply ) => {
      
        return reply.status( 200 ).send( { message: "OK" } );
    } );
}