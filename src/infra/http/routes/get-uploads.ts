import { getUploads } from "@/app/functions/get-uploads";
import { uploadImage } from "@/app/functions/uploads-images";
import { db } from "@/infra/db";
import { schema } from "@/infra/db/schemas";
import { isRight, unwrapEither } from "@/shared/either";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

export const getUploadsRoute: FastifyPluginAsyncZod = async ( server ) => {
    server.get( "/uploads", {
        schema: {
            summary: "Upload an image",
            tags: [ "uploads" ],
            querystring: z.object({
                searchQuery: z.string().optional(),
                sortBy: z.enum([ "createdAt" ]).default( "createdAt" ),
                sortDirection: z.enum([ "asc", "desc" ]).optional(),
                page: z.coerce.number().optional().default(1),
                pageSize: z.coerce.number().optional().default(20)
            }),
            response: {
                200: z.object( { 
                    uploads: z.array( z.object( {
                        id: z.string(),
                        name: z.string(),
                        remoteKey: z.string(),
                        remoteUrl: z.string(),
                        createdAt: z.date()
                    } ) ),
                    total: z.number() 
                } ),
                400: z.object( { message: z.string() } ).describe( "Error retrieving the uploads" )
            }
        }
    }, async ( request, reply ) => {
        const { page, pageSize, sortBy, searchQuery, sortDirection } = request.query;
        const result = await getUploads({ page, pageSize, searchQuery, sortBy, sortDirection });

        const { total, uploads } = unwrapEither( result );


        return reply.status( 200 ).send( { total, uploads } );
    } );
}