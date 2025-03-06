import { exportUploads } from "@/app/functions/export-uploads";
import { unwrapEither } from "@/shared/either";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

export const healthCheckRoute: FastifyPluginAsyncZod = async ( server ) => {
    server.post( "/uploads/exports", {
        schema: {
            summary: "export uploads",
            tags: [ "uploads" ],
            querystring: z.object({
                searchQuery: z.string().optional(),
            }),
            response: {
                200: z.object( { 
                    reportUrl: z.string(),
                } ),
                400: z.object( { message: z.string() } ).describe( "Error retrieving the uploads" )
            }
        }
    }, async ( request, reply ) => {
        const { searchQuery } = request.query;
        const result = await exportUploads({ searchQuery });

        const { reportUrl } = unwrapEither( result );


        return reply.status( 200 ).send( { reportUrl } );
    } );
}