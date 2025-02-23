import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { InvalidFileFormat } from "@/app/functions/errors/invalid-fileformat";
import { uploadImage } from "@/app/functions/uploads-images";
import { db } from "@/infra/db";
import { schema } from "@/infra/db/schemas";
import { isLeft, isRight, unwrapEither } from "@/shared/either";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it, vi } from "vitest";

describe( "upload image", async () => {
    beforeAll( async () => {
        vi.mock( "@/infra/storage/upload-file-to-storage", () => {
            return {
                uploadFileToStorage: vi.fn().mockImplementation( async () => {
                    return {
                        key: `${ randomUUID() }-image.jpg`,
                        url: "https://google.com"
                    }
                } )
            }
        })
    });
    
    it( "should be able to upload an image", async () => {
        const fileName = `${ randomUUID() }-image.jpg`;

        const sut = await uploadImage({
            fileName,
            contentStream: Readable.from( [] ),
            contentType: "image/jpg"
        })

        expect( isRight( sut ) ).toBe( true );

        const result = await db.select().from( schema.uploads ).where(eq( schema.uploads.name, fileName));

        expect( result ).toHaveLength( 1 );

    } );

    it( "shouldn't be able to upload an invalid file", async () => {
        const fileName = `${ randomUUID() }-image.jpg`;

        const sut = await uploadImage({
            fileName,
            contentStream: Readable.from( [] ),
            contentType: "document/pdf"
        })

        expect( isLeft( sut ) ).toBe( true );

        const result = await db.select().from( schema.uploads ).where(eq( schema.uploads.name, fileName));

        expect( unwrapEither( sut ) ).toBeInstanceOf( InvalidFileFormat );

    } );
} );