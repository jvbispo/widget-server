import { env } from "@/env";
import fastifyCors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { fastify } from 'fastify';
import { hasZodFastifySchemaValidationErrors, serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { exportUploadsRoute, healthCheckRoute } from "./routes/export-uploads";
import { getUploadsRoute } from "./routes/get-uploads";
import { uploadImageRoute } from "./routes/upload-image";
import { healthCheckRoute } from "./routes/export-uploads";
import { transformSwaggerSchema } from "./transform-swagger-schema";

const server = fastify();

server.setValidatorCompiler( validatorCompiler );
server.setSerializerCompiler( serializerCompiler );

server.setErrorHandler( ( error, request, reply ) => {
    if( hasZodFastifySchemaValidationErrors( error ) ) {
        return reply.status( 400 ).send( {
            message: "Validation Error",
            issues: error.validation
        } );
    }

    // send error to sentry or other error tracking service
    console.error( error );

    return reply.status( 500 ).send( { message: "Internal Server Error." } )
} );

server.register( fastifyCors, { origin: "*" } );
server.register( fastifyMultipart );
server.register( fastifySwagger, { 
    openapi: {
        info: {
            title: "Upload Server",
            version: "1.0.0",
            description: "API to upload images"
        }
    },
    transform: transformSwaggerSchema
} );

server.register( fastifySwaggerUi, {
    routePrefix: "/docs",
} );
server.register( uploadImageRoute );
server.register( getUploadsRoute );
server.register( exportUploadsRoute );
server.register( healthCheckRoute )

server.listen( { port: 3333, host: "0.0.0.0" } ).then( e => {
    console.log( "Server running!!!" )
} )