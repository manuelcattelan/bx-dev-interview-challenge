function getCommonConfig() {
  return {
    port: parseInt(process.env.PORT ?? '3000', 10),
    database: {
      url: process.env.DATABASE_URL,
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    s3: {
      region: process.env.S3_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT || 'your-s3-endpoint',
      bucketName: process.env.S3_BUCKET_NAME || 'your-s3-bucket-name',
      accessKeyId: process.env.S3_ACCESS_KEY_ID || 'your-access-key-id',
      secretAccessKey:
        process.env.S3_SECRET_ACCESS_KEY || 'your-secret-access-key',
    },
  };
}

export default getCommonConfig;
