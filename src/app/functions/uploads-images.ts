import { Readable } from "node:stream";
import { db } from "@/infra/db";
import { schema } from "@/infra/db/schemas";
import { uploadFileToStorage } from "@/infra/storage/upload-file-to-storage";
import { type Either, Left, Right, makeLeft, makeRight } from "@/shared/either";
import { z } from "zod";
import { InvalidFileFormat } from "./errors/invalid-fileformat";

const uploadImageInput = z.object({
    fileName: z.string(),
    contentType: z.string(),
    contentStream: z.instanceof( Readable )
});

type UploadImageInput = z.input<typeof uploadImageInput>;

const allowedMimeTypes = [ "image/jpg", "image/png", "image/webp" ];

export async function uploadImage(input: UploadImageInput): Promise<Either<InvalidFileFormat, { url: string }>> {
    const { contentStream, contentType, fileName } = uploadImageInput.parse( input );

    if( !allowedMimeTypes.includes( contentType ) ) {
        return makeLeft( new InvalidFileFormat() )
    }

    //TODO - upload image to R2 or other storage service
    const { key, url } = await uploadFileToStorage({
        contentStream,
        contentType,
        fileName,
        folder: "images"
    })

    await db.insert( schema.uploads ).values({
        name: fileName,
        remoteKey: key,
        remoteUrl: url
    });

    return makeRight( { url } )
}