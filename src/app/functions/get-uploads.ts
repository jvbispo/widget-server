import { Readable } from "node:stream";
import { db } from "@/infra/db";
import { schema } from "@/infra/db/schemas";
import { uploadFileToStorage } from "@/infra/storage/upload-file-to-storage";
import { type Either, Left, Right, makeLeft, makeRight } from "@/shared/either";
import { asc, count, desc, ilike } from "drizzle-orm";
import { z } from "zod";
import { InvalidFileFormat } from "./errors/invalid-fileformat";

const getUploadsInput = z.object({
    searchQuery: z.string().optional(),
    sortBy: z.enum([ "createdAt" ]).default( "createdAt" ),
    sortDirection: z.enum([ "asc", "desc" ]).optional(),
    page: z.number().optional().default(1),
    pageSize: z.number().optional().default(20)
});

type GetImagesInput = z.input<typeof getUploadsInput>;


type GetUploadsOutput = {
    total: number;
    uploads: {
        id: string;
        name: string;
        remoteUrl: string;
        remoteKey: string;
        createdAt: Date;
    }[];
}

export async function getUploads(input: GetImagesInput): Promise<Either<never, GetUploadsOutput>> {
    const { page, pageSize, sortBy, searchQuery, sortDirection } = getUploadsInput.parse( input );

    const [ uploads, [ { total } ] ] = await Promise.all([
        db.select({
            id: schema.uploads.id,
            name: schema.uploads.name,
            remoteUrl: schema.uploads.remoteUrl,
            remoteKey: schema.uploads.remoteKey,
            createdAt: schema.uploads.createdAt
        })
        .from( schema.uploads )
        .where(
            searchQuery ? ilike( schema.uploads.name, `%${searchQuery}%` ) : undefined
        )
        .orderBy( fields => {
            if( sortBy && sortDirection === "asc" ) {
                return asc( fields[ sortBy ] );
            }

            if( sortBy && sortDirection === "desc" ) {
                return desc( fields[ sortBy ] );
            }
            return desc( fields.id );
        } )
        .offset((page - 1 ) * pageSize)
        .limit( pageSize ),

        db.select( { total: count( schema.uploads.id ) } )
        .from( schema.uploads )
        .where(
            searchQuery ? ilike( schema.uploads.name, `%${searchQuery}%` ) : undefined
        )
    ]);

    return makeRight( { uploads, total } );
}