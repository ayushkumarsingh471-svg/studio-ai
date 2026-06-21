import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Yeh file hamare app ko UploadThing ke servers se connect karegi
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});