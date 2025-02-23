import { uploadImage } from "@/app/functions/uploads-images";
import { db } from "@/infra/db";
import { schema } from "@/infra/db/schemas";
import { isRight, unwrapEither } from "@/shared/either";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

export const uploadImageRoute: FastifyPluginAsyncZod = async ( server ) => {
    server.post( "/uploads", {
        schema: {
            summary: "Upload an image",
            consumes: [ 'multipart/form-data' ],
            tags: [ "uploads" ],
            response: {
                201: z.null().describe( "Image Uploaded" ),
                400: z.object( { message: z.string() } ).describe( "File is required or already exists" )
            }
        }
    }, async ( request, reply ) => {
        const uploadedFile = await request.file({
            limits: { 
                fieldSize: 1024 * 1024 * 2 // 2mb
            }
        });
        
        if( !uploadedFile ) {
            return reply.status( 400 ).send( { message: "file is required" } );
        }

       const result = await uploadImage( { 
            fileName: uploadedFile.filename,
            contentStream: uploadedFile.file,
            contentType: uploadedFile.mimetype
        } );

        if( uploadedFile.file.truncated ) {
            return reply.status( 400 ).send( { message: "file size limit reached" } )
        }

        if( isRight( result ) ) {
            const { url } = unwrapEither( result );
            console.log( url );
            return reply.status( 201 ).send( )

        }

        const error = unwrapEither( result );

        switch( error.constructor.name ) {
            case "InvalidFileFormat": 
                return reply.status( 400 ).send( { message: error.message } );
        }

    } );
}