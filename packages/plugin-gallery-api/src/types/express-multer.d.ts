declare namespace Express {
  namespace Multer {
    interface File {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    }
  }
}
