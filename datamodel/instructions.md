Fastify DynamoDB Skilift API


* Refer to DynamoDB datamodel/skilifts.json. Understand the model, tables, indexes.
* Create a Fastify API that does CRUD operations on the Skilift Table
* Use latest version of AWS SDK 
* Use Typescript
- **Fastify 5.x**: Web framework
- **Zod**: Schema validation
- **@fastify/cors**: CORS handling
- **Biome**: Code linting and formatting
- **dotenv**: Environment variable management
* Use these middlewares
** Helmet
** Compress
** Cors
* Create DynamoDB database code as Plugins
* Use local DyanmoDB but use env for configuration to connect to remote DynamoDB
* - Uses ES modules (`"type": "module"` in package.json)
* Use biome for linting formatting
* Create routes . ROutes call a service that calls the database operations