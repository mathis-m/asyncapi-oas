import {AsyncAPIDocument} from "@asyncapi/parser"
import {OpenAPIV3} from "openapi-types";

class OpenAPIV3FromAsyncAPIDocument implements OpenAPIV3.Document {
    get "x-express-openapi-validation-strict"(): boolean | undefined {
        return undefined;
    }

    get "x-express-openapi-additional-middleware"(): undefined | (((request: any, response: any, next: any) => Promise<void>) | ((request: any, response: any, next: any) => void))[] {
        return undefined;
    }

    get tags(): undefined | OpenAPIV3.TagObject[] {
        const tags = this.asyncApiDoc.tags();
        if (!tags || tags && tags.length === 0) {
            return undefined
        }
        return tags.map(t => t.json())
    }

    get servers(): undefined | OpenAPIV3.ServerObject[] {
        const oasServers = Object.values(this.asyncApiDoc.servers()).map(s => {
            const server = s.json();
            const oasServer: OpenAPIV3.ServerObject = {
                url: server.url,
            };
            server.description = server.description !== null ? server.description : undefined;
            if (server.description !== undefined) {
                oasServer.description = server.description;
            }
            if (server.variables && Object.keys(server.variables || {}).length > 0) {
                oasServer.variables = {}
                Object.keys(server.variables || {}).forEach(key => {
                    if (oasServer.variables) {
                        oasServer.variables[key] = {
                            default: server.variables[key].default,
                        };
                        if (server.variables[key].description) {
                            oasServer.variables[key].description = server.variables[key].description
                        }
                        if (server.variables[key].description) {
                            oasServer.variables[key].enum = server.variables[key].enum
                        }
                    }
                })
            }
            return oasServer;
        });
        return oasServers && oasServers.length > 0 ? oasServers : undefined;
    }

    get security(): undefined | OpenAPIV3.SecurityRequirementObject[] {
        return undefined;
    }

    get paths(): OpenAPIV3.PathsObject<{}> {
        const oasPaths: OpenAPIV3.PathsObject = {};
        let channels = this.asyncApiDoc.channels();
        Object.keys(channels || {}).forEach(key => {
            const channel = channels[key].json();
            const oasParams: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[] = []
            Object.keys(channel.parameters || {}).forEach(key => {
                const parameter = channel.parameters[key];
                oasParams.push({
                    in: "header",
                    name: key,
                    $ref: parameter.$ref,
                    description: parameter.description,
                    schema: parameter.schema
                })
            })

            const getOperation = (op: any) => {
                return op ? {
                    operationId: op.operationId,
                    summary: op.summary,
                    description: op.description !== null ? op.description : undefined,
                    tags: op.tags && op.tags.length > 0 ? op.tags.map((t: any) => t.name as string) : undefined,
                    externalDocs: op.externalDocs,
                } as any : undefined;
            }

            const subscribe: OpenAPIV3.OperationObject<{}> = getOperation(channel.subscribe)
            const publish: OpenAPIV3.OperationObject<{}> = getOperation(channel.publish);
            if(!key.startsWith("/")) {
                key = `/${key}`
            }
            oasPaths[key] = {
                $ref: channel.$ref,
                description: channel.description,
                parameters: oasParams.length > 0 ? oasParams : undefined,
                subscribe,
                publish
            } as any;
        });
        return oasPaths;
    }

    get info(): OpenAPIV3.InfoObject {
        const info = this.asyncApiDoc.info().json();
        return {
            title: info.title,
            version: info.version,
            description: info.description !== null ? info.description : undefined,
            termsOfService: info.termsOfService,
            contact: info.contact
                ? {
                    email: info.contact.email,
                    name: info.contact.name,
                    url: info.contact.url,
                }
                : undefined,
            license: info.license
                ? {
                    name: info.license.name,
                    url: info.license.url
                }
                : undefined
        };
    }

    get externalDocs(): undefined | OpenAPIV3.ExternalDocumentationObject {
        const externalDocs = this.asyncApiDoc.json().externalDocs;
        if (!externalDocs) {
            return undefined;
        }
        const oasExternalDocs: OpenAPIV3.ExternalDocumentationObject = {
            url: externalDocs.url
        }
        externalDocs.description = externalDocs.description !== null ? externalDocs.description : undefined;
        if (externalDocs.description !== undefined) {
            oasExternalDocs.description = externalDocs.description;
        }
        return oasExternalDocs;
    }

    get components(): undefined | OpenAPIV3.ComponentsObject {
        return undefined;
    }

    constructor(private asyncApiDoc: AsyncAPIDocument) {
    }

    openapi: string = "3.0.0";

    toJS(): OpenAPIV3.Document {
        return {
            openapi: this.openapi,
            paths: this.paths,
            info: this.info,
            components: this.components,
            servers: this.servers,
            tags: this.tags,
            security: this.security,
            externalDocs: this.externalDocs,
            "x-express-openapi-additional-middleware": this["x-express-openapi-additional-middleware"],
            "x-express-openapi-validation-strict": this["x-express-openapi-validation-strict"]
        }
    }
}

export class OAS {
    static from(asyncApiDocument: AsyncAPIDocument): OpenAPIV3.Document {
        return new OpenAPIV3FromAsyncAPIDocument(asyncApiDocument).toJS();
    }
}