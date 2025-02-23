import { randomUUID } from "node:crypto";
import * as upload from "@/infra/storage/upload-file-to-storage";
import { isRight, unwrapEither } from "@/shared/either";
import { makeUpload } from "@/tests/factories/make-uploads";
import dayjs from "dayjs";
import { describe, expect, it, vi } from "vitest";
import { exportUploads } from "./export-uploads";




describe( "export uploads", () => {
    it( "should export the uploads", async () => {
        const uploadStub = vi.spyOn( upload, "uploadFileToStorage" ).mockImplementationOnce( async () => {
            return {
                key: `${ randomUUID() }.csv`,
                url: "http://example.com"
            }
        } );

        const namePattern = randomUUID();
        const upload1 = await makeUpload( { name: `${namePattern}.webp`, createdAt: dayjs().subtract( 1, "day" ).toDate() } );
        const upload2 = await makeUpload( { name: `${namePattern}.webp`, createdAt: dayjs().subtract( 2, "day" ).toDate() } );
        const upload3 = await makeUpload( { name: `${namePattern}.webp`, createdAt: dayjs().subtract( 3, "day" ).toDate() } );
        const upload4 = await makeUpload( { name: `${namePattern}.webp`, createdAt: dayjs().subtract( 4, "day" ).toDate() } );
        const upload5 = await makeUpload( { name: `${namePattern}.webp`, createdAt: dayjs().subtract( 5, "day" ).toDate() } );

        const sut = await exportUploads({
            searchQuery: namePattern,
        });

        const generatedCsvStream = uploadStub.mock.calls[0][0].contentStream;

        const csvAsString = await new Promise<string>( ( resolve, reject ) => {
            const chunks: Buffer[] = [];

            generatedCsvStream.on( "data", ( chunk: Buffer ) => {
                chunks.push( chunk );
            });

            generatedCsvStream.on( "end", () => {
                resolve( Buffer.concat( chunks ).toString( "utf-8" ) );
            });

            generatedCsvStream.on( "error", ( err ) => {
                reject( err );
            });
        });

        const csvAsArray = csvAsString
        .trim()
        .split( "\n" )
        .map( line => line.split( "," ) );

        expect( isRight( sut ) ).toBe( true );
        expect( unwrapEither( sut ) ).toEqual( {
            reportUrl: "http://example.com"
        });
        expect( csvAsArray ).toEqual( [
            [ "ID", "Name", "Remote URL", "Uploaded At" ],
            [ upload1.id, upload1.name, upload1.remoteUrl, expect.any( String ) ],
            [ upload2.id, upload2.name, upload2.remoteUrl, expect.any( String ) ],
            [ upload3.id, upload3.name, upload3.remoteUrl, expect.any( String ) ],
            [ upload4.id, upload4.name, upload4.remoteUrl, expect.any( String ) ],
            [ upload5.id, upload5.name, upload5.remoteUrl, expect.any( String ) ],
        ]);
    });
} );