import swaggerJSDoc from "swagger-jsdoc";


export const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'E-commerce API',
            version: '1.0.0',
            description: 'Backend API for the E-commerce store'
        },
        servers: [
            {
                url: 'https://ecommerce-backend-dgqt.onrender.com',
                description: 'Production Server'
            },
            {
                url: 'http://localhost:5001',
                description: 'Development Server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: [
        './src/docs/auth.docs.yaml',
        './src/docs/cart.docs.yaml',
        './src/docs/category.docs.yaml',
        './src/docs/product.docs.yaml',
        './src/docs/order.docs.yaml',
    ]
})