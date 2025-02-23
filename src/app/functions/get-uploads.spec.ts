import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { InvalidFileFormat } from "@/app/functions/errors/invalid-fileformat";
import { uploadImage } from "@/app/functions/uploads-images";
import { db } from "@/infra/db";
import { schema } from "@/infra/db/schemas";
import { isLeft, isRight, unwrapEither } from "@/shared/either";
import { makeUpload } from "@/tests/factories/make-uploads";
import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { getUploads } from "./get-uploads";

describe( "get uploads", async () => {
    
    it( "shouldn't be able to upload an invalid file", async () => {
        const namePattern = randomUUID();
        const upload1 = await makeUpload( { name: `${namePattern}.webp` } );
        const upload2 = await makeUpload( { name: `${namePattern}.webp` } );
        const upload3 = await makeUpload( { name: `${namePattern}.webp` } );
        const upload4 = await makeUpload( { name: `${namePattern}.webp` } );
        const upload5 = await makeUpload( { name: `${namePattern}.webp` } );

        const sut = await getUploads({
            searchQuery: namePattern
        });

        expect( isRight( sut ) ).toBe( true );
        expect( unwrapEither( sut ).uploads ).toEqual( [
            expect.objectContaining( { id: upload5.id } ),
            expect.objectContaining( { id: upload4.id } ),
            expect.objectContaining( { id: upload3.id } ),
            expect.objectContaining( { id: upload2.id } ),
            expect.objectContaining( { id: upload1.id } ),
        ] );
    } );

    it( "shouldn't be able to get paginated uploads", async () => {
        const namePattern = randomUUID();
        const upload1 = await makeUpload( { name: `${namePattern}.webp` } );
        const upload2 = await makeUpload( { name: `${namePattern}.webp` } );
        const upload3 = await makeUpload( { name: `${namePattern}.webp` } );
        const upload4 = await makeUpload( { name: `${namePattern}.webp` } );
        const upload5 = await makeUpload( { name: `${namePattern}.webp` } );

        const sut = await getUploads({
            searchQuery: namePattern,
            page: 1,
            pageSize: 2
        });

        expect( isRight( sut ) ).toBe( true );
        expect( unwrapEither( sut ).uploads ).toEqual( [
            expect.objectContaining( { id: upload5.id } ),
            expect.objectContaining( { id: upload4.id } )
        ] );
    } );

    it( "shouldn't be able to get sorted uploads - desc", async () => {
        const namePattern = randomUUID();
        const upload1 = await makeUpload( { name: `${namePattern}.webp`, createdAt: dayjs().subtract( 1, "day" ).toDate() } );
        const upload2 = await makeUpload( { name: `${namePattern}.webp`, createdAt: dayjs().subtract( 2, "day" ).toDate() } );
        const upload3 = await makeUpload( { name: `${namePattern}.webp`, createdAt: dayjs().subtract( 3, "day" ).toDate() } );
        const upload4 = await makeUpload( { name: `${namePattern}.webp`, createdAt: dayjs().subtract( 4, "day" ).toDate() } );
        const upload5 = await makeUpload( { name: `${namePattern}.webp`, createdAt: dayjs().subtract( 5, "day" ).toDate() } );

        const sut = await getUploads({
            searchQuery: namePattern,
            sortBy: "createdAt",
            sortDirection: "desc"
        });

        expect( isRight( sut ) ).toBe( true );
        expect( unwrapEither( sut ).uploads ).toEqual( [
            expect.objectContaining( { id: upload1.id } ),
            expect.objectContaining( { id: upload2.id } ),
            expect.objectContaining( { id: upload3.id } ),
            expect.objectContaining( { id: upload4.id } ),
            expect.objectContaining( { id: upload5.id } ),
        ] );
    } );

    it( "shouldn't be able to get sorted uploads - asc", async () => {
        const namePattern = randomUUID();
        const upload1 = await makeUpload( { name: `${namePattern}.webp`, createdAt: dayjs().subtract( 1, "day" ).toDate() } );
        const upload2 = await makeUpload( { name: `${namePattern}.webp`, createdAt: dayjs().subtract( 2, "day" ).toDate() } );
        const upload3 = await makeUpload( { name: `${namePattern}.webp`, createdAt: dayjs().subtract( 3, "day" ).toDate() } );
        const upload4 = await makeUpload( { name: `${namePattern}.webp`, createdAt: dayjs().subtract( 4, "day" ).toDate() } );
        const upload5 = await makeUpload( { name: `${namePattern}.webp`, createdAt: dayjs().subtract( 5, "day" ).toDate() } );

        const sut = await getUploads({
            searchQuery: namePattern,
            sortBy: "createdAt",
            sortDirection: "asc"
        });

        expect( isRight( sut ) ).toBe( true );
        expect( unwrapEither( sut ).uploads ).toEqual( [
            expect.objectContaining( { id: upload5.id } ),
            expect.objectContaining( { id: upload4.id } ),
            expect.objectContaining( { id: upload3.id } ),
            expect.objectContaining( { id: upload2.id } ),
            expect.objectContaining( { id: upload1.id } ),
        ] );
    } );
} );