import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// File Router: Yahan hum batate hain ki kya upload hoga
export const ourFileRouter = {
  // Hum sirf images allow kar rahe hain, maximum size 8MB
  imageUploader: f({ image: { maxFileSize: "8MB" } })
    .onUploadComplete(async ({ metadata, file }) => {
      // Jab photo upload ho jayegi toh uska permanent link yahan aayega
      console.log("Upload complete! Permanent URL:", file.url);
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;