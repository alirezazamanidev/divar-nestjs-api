declare namespace NodeJS {
  interface ProcessEnv {
    // Node
    NODE_ENV: string;
    
    // Auth
    OTP_TIME_EXPIRED: number; // 2 minutes in milliseconds
    
    // Application
    FRONTEND_URL: string;
    APP_PORT: number;
    APP_HOST: string;
    APP_VERSION: string;
    APP_NAME: string;
    
    // Admin info
    ADMIN_USERNAME: string;
    ADMIN_PHONE: string;
    
    // Database
    MYSQL_PORT: number;
    MYSQL_HOST: string;
    MYSQL_USERNAME: string;
    MYSQL_PASSWORD: string;
    MYSQL_DATABASE: string;
    
    // Redis
    REDIS_PORT: number;
    REDIS_HOST: string;
    
    // JWT
    COOKIE_SECRET_KEY: string;
    ACCESS_TOKEN_SECRET_KEY: string;
    REFRESH_TOKEN_SECRET_KEY: string;
    
    // Zarinpal
    ZARINPAL_MERCHANT_ID: string;
    ZARINPAL_CALLBACK_URL: string;
    ZARINPAL_WEB_GATE_URL: string;
    ZARINPAL_VERIFY_URL: string;
    ZARINPAL_PAYMENT_GATEWAY: string;

    // Liara
    LIARA_BUCKET_NAME: string;
    LIARA_ACCESS_KEY: string;
    LIARA_SECRET_KEY: string;
    LIARA_REGION: string;
    LIARA_ENDPOINT: string;
    // Ai 
    OPENAI_API_KEY:string
  }
}