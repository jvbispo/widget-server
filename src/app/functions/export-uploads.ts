import { PassThrough, Readable, Transform } from "node:stream";

import { pipeline } from "node:stream/promises";
import { db, pg } from "@/infra/db";
import { schema } from "@/infra/db/schemas";
import { uploadFileToStorage } from "@/infra/storage/upload-file-to-storage";
import { type Either, Left, Right, makeLeft, makeRight } from "@/shared/either";
import { stringify } from "csv-stringify";
import { asc, count, desc, ilike } from "drizzle-orm";
import { z } from "zod";
import { InvalidFileFormat } from "./errors/invalid-fileformat";

const getUploadsInput = z.object({
    searchQuery: z.string().optional()
});

type ExportUploadsInput = z.input<typeof getUploadsInput>;


type ExportUploadsOutput = {
    reportUrl: string;
}

export async function exportUploads(input: ExportUploadsInput): Promise<Either<never, ExportUploadsOutput>> {
    const { searchQuery } = getUploadsInput.parse( input );
    
    const { params, sql } = db.select({
        id: schema.uploads.id,
        name: schema.uploads.name,
        remoteUrl: schema.uploads.remoteUrl,
        createdAt: schema.uploads.createdAt
    })
    .from( schema.uploads )
    .where(
        searchQuery ? ilike( schema.uploads.name, `%${searchQuery}%` ) : undefined
    ).toSQL();

    const cursor = pg.unsafe( sql, params as string[] ).cursor(2);

    const csv = stringify( {
        delimiter: ",",
        header: true,
        columns: [
            { key: "id", header: "ID" },
            { key: "name", header: "Name" },
            { key: "remote_url", header: "Remote URL" },
            { key: "created_at", header: "Uploaded At" }
        ]
    } );

    const uploadToStorageStream = new PassThrough();

    const convertToCSVPipeline = pipeline(
        cursor,
        new Transform({
            objectMode: true,
            transform( chunks: unknown[], encoding, callback ) {
                for ( const chunk of chunks ) {
                    // console.log( chunk );
                    this.push( chunk );
                }
                callback();
            }
        }),
        csv,
        // new Transform({
        //     transform( chunk: Buffer, encoding, callback ) {
        //         // console.log( chunk.toString() );
        //         callback();
        //     }
        // }),
        uploadToStorageStream
    );

    const uploadToStorage = uploadFileToStorage({
        contentType: "text/csv",
        folder: "downloads",
        fileName: `${new Date().toISOString()}-uploads.csv`,
        contentStream: uploadToStorageStream
    });

    const [{ url }] = await Promise.all( [ uploadToStorage, convertToCSVPipeline ] );

   
    return makeRight( { reportUrl: url } );
}