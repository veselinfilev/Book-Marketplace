(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('http'), require('fs'), require('crypto')) :
    typeof define === 'function' && define.amd ? define(['http', 'fs', 'crypto'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Server = factory(global.http, global.fs, global.crypto));
}(this, (function (http, fs, crypto) { 'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var http__default = /*#__PURE__*/_interopDefaultLegacy(http);
    var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
    var crypto__default = /*#__PURE__*/_interopDefaultLegacy(crypto);

    class ServiceError extends Error {
        constructor(message = 'Service Error') {
            super(message);
            this.name = 'ServiceError'; 
        }
    }

    class NotFoundError extends ServiceError {
        constructor(message = 'Resource not found') {
            super(message);
            this.name = 'NotFoundError'; 
            this.status = 404;
        }
    }

    class RequestError extends ServiceError {
        constructor(message = 'Request error') {
            super(message);
            this.name = 'RequestError'; 
            this.status = 400;
        }
    }

    class ConflictError extends ServiceError {
        constructor(message = 'Resource conflict') {
            super(message);
            this.name = 'ConflictError'; 
            this.status = 409;
        }
    }

    class AuthorizationError extends ServiceError {
        constructor(message = 'Unauthorized') {
            super(message);
            this.name = 'AuthorizationError'; 
            this.status = 401;
        }
    }

    class CredentialError extends ServiceError {
        constructor(message = 'Forbidden') {
            super(message);
            this.name = 'CredentialError'; 
            this.status = 403;
        }
    }

    var errors = {
        ServiceError,
        NotFoundError,
        RequestError,
        ConflictError,
        AuthorizationError,
        CredentialError
    };

    const { ServiceError: ServiceError$1 } = errors;


    function createHandler(plugins, services) {
        return async function handler(req, res) {
            const method = req.method;
            console.info(`<< ${req.method} ${req.url}`);

            // Redirect fix for admin panel relative paths
            if (req.url.slice(-6) == '/admin') {
                res.writeHead(302, {
                    'Location': `http://${req.headers.host}/admin/`
                });
                return res.end();
            }

            let status = 200;
            let headers = {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            };
            let result = '';
            let context;

            // NOTE: the OPTIONS method results in undefined result and also it never processes plugins - keep this in mind
            if (method == 'OPTIONS') {
                Object.assign(headers, {
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Credentials': false,
                    'Access-Control-Max-Age': '86400',
                    'Access-Control-Allow-Headers': 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-Authorization, X-Admin'
                });
            } else {
                try {
                    context = processPlugins();
                    await handle(context);
                } catch (err) {
                    if (err instanceof ServiceError$1) {
                        status = err.status || 400;
                        result = composeErrorObject(err.code || status, err.message);
                    } else {
                        // Unhandled exception, this is due to an error in the service code - REST consumers should never have to encounter this;
                        // If it happens, it must be debugged in a future version of the server
                        console.error(err);
                        status = 500;
                        result = composeErrorObject(500, 'Server Error');
                    }
                }
            }

            res.writeHead(status, headers);
            if (context != undefined && context.util != undefined && context.util.throttle) {
                await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
            }
            res.end(result);

            function processPlugins() {
                const context = { params: {} };
                plugins.forEach(decorate => decorate(context, req));
                return context;
            }

            async function handle(context) {
                const { serviceName, tokens, query, body } = await parseRequest(req);
                if (serviceName == 'admin') {
                    return ({ headers, result } = services['admin'](method, tokens, query, body));
                } else if (serviceName == 'favicon.ico') {
                    return ({ headers, result } = services['favicon'](method, tokens, query, body));
                }

                const service = services[serviceName];

                if (service === undefined) {
                    status = 400;
                    result = composeErrorObject(400, `Service "${serviceName}" is not supported`);
                    console.error('Missing service ' + serviceName);
                } else {
                    result = await service(context, { method, tokens, query, body });
                }

                // NOTE: logout does not return a result
                // in this case the content type header should be omitted, to allow checks on the client
                if (result !== undefined) {
                    result = JSON.stringify(result);
                } else {
                    status = 204;
                    delete headers['Content-Type'];
                }
            }
        };
    }



    function composeErrorObject(code, message) {
        return JSON.stringify({
            code,
            message
        });
    }

    async function parseRequest(req) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const tokens = url.pathname.split('/').filter(x => x.length > 0);
        const serviceName = tokens.shift();
        const queryString = url.search.split('?')[1] || '';
        const query = queryString
            .split('&')
            .filter(s => s != '')
            .map(x => x.split('='))
            .reduce((p, [k, v]) => Object.assign(p, { [k]: decodeURIComponent(v) }), {});
        const body = await parseBody(req);

        return {
            serviceName,
            tokens,
            query,
            body
        };
    }

    function parseBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', (chunk) => body += chunk.toString());
            req.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (err) {
                    resolve(body);
                }
            });
        });
    }

    var requestHandler = createHandler;

    class Service {
        constructor() {
            this._actions = [];
            this.parseRequest = this.parseRequest.bind(this);
        }

        /**
         * Handle service request, after it has been processed by a request handler
         * @param {*} context Execution context, contains result of middleware processing
         * @param {{method: string, tokens: string[], query: *, body: *}} request Request parameters
         */
        async parseRequest(context, request) {
            for (let { method, name, handler } of this._actions) {
                if (method === request.method && matchAndAssignParams(context, request.tokens[0], name)) {
                    return await handler(context, request.tokens.slice(1), request.query, request.body);
                }
            }
        }

        /**
         * Register service action
         * @param {string} method HTTP method
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        registerAction(method, name, handler) {
            this._actions.push({ method, name, handler });
        }

        /**
         * Register GET action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        get(name, handler) {
            this.registerAction('GET', name, handler);
        }

        /**
         * Register POST action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        post(name, handler) {
            this.registerAction('POST', name, handler);
        }

        /**
         * Register PUT action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        put(name, handler) {
            this.registerAction('PUT', name, handler);
        }

        /**
         * Register PATCH action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        patch(name, handler) {
            this.registerAction('PATCH', name, handler);
        }

        /**
         * Register DELETE action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        delete(name, handler) {
            this.registerAction('DELETE', name, handler);
        }
    }

    function matchAndAssignParams(context, name, pattern) {
        if (pattern == '*') {
            return true;
        } else if (pattern[0] == ':') {
            context.params[pattern.slice(1)] = name;
            return true;
        } else if (name == pattern) {
            return true;
        } else {
            return false;
        }
    }

    var Service_1 = Service;

    function uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    var util = {
        uuid
    };

    const uuid$1 = util.uuid;


    const data = fs__default['default'].existsSync('./data') ? fs__default['default'].readdirSync('./data').reduce((p, c) => {
        const content = JSON.parse(fs__default['default'].readFileSync('./data/' + c));
        const collection = c.slice(0, -5);
        p[collection] = {};
        for (let endpoint in content) {
            p[collection][endpoint] = content[endpoint];
        }
        return p;
    }, {}) : {};

    const actions = {
        get: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            let responseData = data;
            for (let token of tokens) {
                if (responseData !== undefined) {
                    responseData = responseData[token];
                }
            }
            return responseData;
        },
        post: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            console.log('Request body:\n', body);

            // TODO handle collisions, replacement
            let responseData = data;
            for (let token of tokens) {
                if (responseData.hasOwnProperty(token) == false) {
                    responseData[token] = {};
                }
                responseData = responseData[token];
            }

            const newId = uuid$1();
            responseData[newId] = Object.assign({}, body, { _id: newId });
            return responseData[newId];
        },
        put: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            console.log('Request body:\n', body);

            let responseData = data;
            for (let token of tokens.slice(0, -1)) {
                if (responseData !== undefined) {
                    responseData = responseData[token];
                }
            }
            if (responseData !== undefined && responseData[tokens.slice(-1)] !== undefined) {
                responseData[tokens.slice(-1)] = body;
            }
            return responseData[tokens.slice(-1)];
        },
        patch: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            console.log('Request body:\n', body);

            let responseData = data;
            for (let token of tokens) {
                if (responseData !== undefined) {
                    responseData = responseData[token];
                }
            }
            if (responseData !== undefined) {
                Object.assign(responseData, body);
            }
            return responseData;
        },
        delete: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            let responseData = data;

            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                if (responseData.hasOwnProperty(token) == false) {
                    return null;
                }
                if (i == tokens.length - 1) {
                    const body = responseData[token];
                    delete responseData[token];
                    return body;
                } else {
                    responseData = responseData[token];
                }
            }
        }
    };

    const dataService = new Service_1();
    dataService.get(':collection', actions.get);
    dataService.post(':collection', actions.post);
    dataService.put(':collection', actions.put);
    dataService.patch(':collection', actions.patch);
    dataService.delete(':collection', actions.delete);


    var jsonstore = dataService.parseRequest;

    /*
     * This service requires storage and auth plugins
     */

    const { AuthorizationError: AuthorizationError$1 } = errors;



    const userService = new Service_1();

    userService.get('me', getSelf);
    userService.post('register', onRegister);
    userService.post('login', onLogin);
    userService.get('logout', onLogout);


    function getSelf(context, tokens, query, body) {
        if (context.user) {
            const result = Object.assign({}, context.user);
            delete result.hashedPassword;
            return result;
        } else {
            throw new AuthorizationError$1();
        }
    }

    function onRegister(context, tokens, query, body) {
        return context.auth.register(body);
    }

    function onLogin(context, tokens, query, body) {
        return context.auth.login(body);
    }

    function onLogout(context, tokens, query, body) {
        return context.auth.logout();
    }

    var users = userService.parseRequest;

    const { NotFoundError: NotFoundError$1, RequestError: RequestError$1 } = errors;


    var crud = {
        get,
        post,
        put,
        patch,
        delete: del
    };


    function validateRequest(context, tokens, query) {
        /*
        if (context.params.collection == undefined) {
            throw new RequestError('Please, specify collection name');
        }
        */
        if (tokens.length > 1) {
            throw new RequestError$1();
        }
    }

    function parseWhere(query) {
        const operators = {
            '<=': (prop, value) => record => record[prop] <= JSON.parse(value),
            '<': (prop, value) => record => record[prop] < JSON.parse(value),
            '>=': (prop, value) => record => record[prop] >= JSON.parse(value),
            '>': (prop, value) => record => record[prop] > JSON.parse(value),
            '=': (prop, value) => record => record[prop] == JSON.parse(value),
            ' like ': (prop, value) => record => record[prop].toLowerCase().includes(JSON.parse(value).toLowerCase()),
            ' in ': (prop, value) => record => JSON.parse(`[${/\((.+?)\)/.exec(value)[1]}]`).includes(record[prop]),
        };
        const pattern = new RegExp(`^(.+?)(${Object.keys(operators).join('|')})(.+?)$`, 'i');

        try {
            let clauses = [query.trim()];
            let check = (a, b) => b;
            let acc = true;
            if (query.match(/ and /gi)) {
                // inclusive
                clauses = query.split(/ and /gi);
                check = (a, b) => a && b;
                acc = true;
            } else if (query.match(/ or /gi)) {
                // optional
                clauses = query.split(/ or /gi);
                check = (a, b) => a || b;
                acc = false;
            }
            clauses = clauses.map(createChecker);

            return (record) => clauses
                .map(c => c(record))
                .reduce(check, acc);
        } catch (err) {
            throw new Error('Could not parse WHERE clause, check your syntax.');
        }

        function createChecker(clause) {
            let [match, prop, operator, value] = pattern.exec(clause);
            [prop, value] = [prop.trim(), value.trim()];

            return operators[operator.toLowerCase()](prop, value);
        }
    }


    function get(context, tokens, query, body) {
        validateRequest(context, tokens);

        let responseData;

        try {
            if (query.where) {
                responseData = context.storage.get(context.params.collection).filter(parseWhere(query.where));
            } else if (context.params.collection) {
                responseData = context.storage.get(context.params.collection, tokens[0]);
            } else {
                // Get list of collections
                return context.storage.get();
            }

            if (query.sortBy) {
                const props = query.sortBy
                    .split(',')
                    .filter(p => p != '')
                    .map(p => p.split(' ').filter(p => p != ''))
                    .map(([p, desc]) => ({ prop: p, desc: desc ? true : false }));

                // Sorting priority is from first to last, therefore we sort from last to first
                for (let i = props.length - 1; i >= 0; i--) {
                    let { prop, desc } = props[i];
                    responseData.sort(({ [prop]: propA }, { [prop]: propB }) => {
                        if (typeof propA == 'number' && typeof propB == 'number') {
                            return (propA - propB) * (desc ? -1 : 1);
                        } else {
                            return propA.localeCompare(propB) * (desc ? -1 : 1);
                        }
                    });
                }
            }

            if (query.offset) {
                responseData = responseData.slice(Number(query.offset) || 0);
            }
            const pageSize = Number(query.pageSize) || 10;
            if (query.pageSize) {
                responseData = responseData.slice(0, pageSize);
            }
    		
    		if (query.distinct) {
                const props = query.distinct.split(',').filter(p => p != '');
                responseData = Object.values(responseData.reduce((distinct, c) => {
                    const key = props.map(p => c[p]).join('::');
                    if (distinct.hasOwnProperty(key) == false) {
                        distinct[key] = c;
                    }
                    return distinct;
                }, {}));
            }

            if (query.count) {
                return responseData.length;
            }

            if (query.select) {
                const props = query.select.split(',').filter(p => p != '');
                responseData = Array.isArray(responseData) ? responseData.map(transform) : transform(responseData);

                function transform(r) {
                    const result = {};
                    props.forEach(p => result[p] = r[p]);
                    return result;
                }
            }

            if (query.load) {
                const props = query.load.split(',').filter(p => p != '');
                props.map(prop => {
                    const [propName, relationTokens] = prop.split('=');
                    const [idSource, collection] = relationTokens.split(':');
                    console.log(`Loading related records from "${collection}" into "${propName}", joined on "_id"="${idSource}"`);
                    const storageSource = collection == 'users' ? context.protectedStorage : context.storage;
                    responseData = Array.isArray(responseData) ? responseData.map(transform) : transform(responseData);

                    function transform(r) {
                        const seekId = r[idSource];
                        const related = storageSource.get(collection, seekId);
                        delete related.hashedPassword;
                        r[propName] = related;
                        return r;
                    }
                });
            }

        } catch (err) {
            console.error(err);
            if (err.message.includes('does not exist')) {
                throw new NotFoundError$1();
            } else {
                throw new RequestError$1(err.message);
            }
        }

        context.canAccess(responseData);

        return responseData;
    }

    function post(context, tokens, query, body) {
        console.log('Request body:\n', body);

        validateRequest(context, tokens);
        if (tokens.length > 0) {
            throw new RequestError$1('Use PUT to update records');
        }
        context.canAccess(undefined, body);

        body._ownerId = context.user._id;
        let responseData;

        try {
            responseData = context.storage.add(context.params.collection, body);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    function put(context, tokens, query, body) {
        console.log('Request body:\n', body);

        validateRequest(context, tokens);
        if (tokens.length != 1) {
            throw new RequestError$1('Missing entry ID');
        }

        let responseData;
        let existing;

        try {
            existing = context.storage.get(context.params.collection, tokens[0]);
        } catch (err) {
            throw new NotFoundError$1();
        }

        context.canAccess(existing, body);

        try {
            responseData = context.storage.set(context.params.collection, tokens[0], body);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    function patch(context, tokens, query, body) {
        console.log('Request body:\n', body);

        validateRequest(context, tokens);
        if (tokens.length != 1) {
            throw new RequestError$1('Missing entry ID');
        }

        let responseData;
        let existing;

        try {
            existing = context.storage.get(context.params.collection, tokens[0]);
        } catch (err) {
            throw new NotFoundError$1();
        }

        context.canAccess(existing, body);

        try {
            responseData = context.storage.merge(context.params.collection, tokens[0], body);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    function del(context, tokens, query, body) {
        validateRequest(context, tokens);
        if (tokens.length != 1) {
            throw new RequestError$1('Missing entry ID');
        }

        let responseData;
        let existing;

        try {
            existing = context.storage.get(context.params.collection, tokens[0]);
        } catch (err) {
            throw new NotFoundError$1();
        }

        context.canAccess(existing);

        try {
            responseData = context.storage.delete(context.params.collection, tokens[0]);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    /*
     * This service requires storage and auth plugins
     */

    const dataService$1 = new Service_1();
    dataService$1.get(':collection', crud.get);
    dataService$1.post(':collection', crud.post);
    dataService$1.put(':collection', crud.put);
    dataService$1.patch(':collection', crud.patch);
    dataService$1.delete(':collection', crud.delete);

    var data$1 = dataService$1.parseRequest;

    const imgdata = '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Td4DLneAwSddMiRH8tMU8nng/Yy+KQsM3AKBNbe35j5OH4A0dbV8AxwcAqMFyl73eHd3e2//nmn29wOGi3Kv+RixSgAAEkxpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+Cjx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDQuNC4wLUV4aXYyIj4KIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgIHhtbG5zOmlwdGNFeHQ9Imh0dHA6Ly9pcHRjLm9yZy9zdGQvSXB0YzR4bXBFeHQvMjAwOC0wMi0yOS8iCiAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICB4bWxuczpwbHVzPSJodHRwOi8vbnMudXNlcGx1cy5vcmcvbGRmL3htcC8xLjAvIgogICAgeG1sbnM6R0lNUD0iaHR0cDovL3d3dy5naW1wLm9yZy94bXAvIgogICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgeG1sbnM6eG1wUmlnaHRzPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvcmlnaHRzLyIKICAgeG1wTU06RG9jdW1lbnRJRD0iZ2ltcDpkb2NpZDpnaW1wOjdjZDM3NWM3LTcwNmItNDlkMy1hOWRkLWNmM2Q3MmMwY2I4ZCIKICAgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2NGY2YTJlYy04ZjA5LTRkZTMtOTY3ZC05MTUyY2U5NjYxNTAiCiAgIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDoxMmE1NzI5Mi1kNmJkLTRlYjQtOGUxNi1hODEzYjMwZjU0NWYiCiAgIEdJTVA6QVBJPSIyLjAiCiAgIEdJTVA6UGxhdGZvcm09IldpbmRvd3MiCiAgIEdJTVA6VGltZVN0YW1wPSIxNjEzMzAwNzI5NTMwNjQzIgogICBHSU1QOlZlcnNpb249IjIuMTAuMTIiCiAgIGRjOkZvcm1hdD0iaW1hZ2UvcG5nIgogICBwaG90b3Nob3A6Q3JlZGl0PSJHZXR0eSBJbWFnZXMvaVN0b2NrcGhvdG8iCiAgIHhtcDpDcmVhdG9yVG9vbD0iR0lNUCAyLjEwIgogICB4bXBSaWdodHM6V2ViU3RhdGVtZW50PSJodHRwczovL3d3dy5pc3RvY2twaG90by5jb20vbGVnYWwvbGljZW5zZS1hZ3JlZW1lbnQ/dXRtX21lZGl1bT1vcmdhbmljJmFtcDt1dG1fc291cmNlPWdvb2dsZSZhbXA7dXRtX2NhbXBhaWduPWlwdGN1cmwiPgogICA8aXB0Y0V4dDpMb2NhdGlvbkNyZWF0ZWQ+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpMb2NhdGlvbkNyZWF0ZWQ+CiAgIDxpcHRjRXh0OkxvY2F0aW9uU2hvd24+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpMb2NhdGlvblNob3duPgogICA8aXB0Y0V4dDpBcnR3b3JrT3JPYmplY3Q+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpBcnR3b3JrT3JPYmplY3Q+CiAgIDxpcHRjRXh0OlJlZ2lzdHJ5SWQ+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpSZWdpc3RyeUlkPgogICA8eG1wTU06SGlzdG9yeT4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgc3RFdnQ6YWN0aW9uPSJzYXZlZCIKICAgICAgc3RFdnQ6Y2hhbmdlZD0iLyIKICAgICAgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpjOTQ2M2MxMC05OWE4LTQ1NDQtYmRlOS1mNzY0ZjdhODJlZDkiCiAgICAgIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkdpbXAgMi4xMCAoV2luZG93cykiCiAgICAgIHN0RXZ0OndoZW49IjIwMjEtMDItMTRUMTM6MDU6MjkiLz4KICAgIDwvcmRmOlNlcT4KICAgPC94bXBNTTpIaXN0b3J5PgogICA8cGx1czpJbWFnZVN1cHBsaWVyPgogICAgPHJkZjpTZXEvPgogICA8L3BsdXM6SW1hZ2VTdXBwbGllcj4KICAgPHBsdXM6SW1hZ2VDcmVhdG9yPgogICAgPHJkZjpTZXEvPgogICA8L3BsdXM6SW1hZ2VDcmVhdG9yPgogICA8cGx1czpDb3B5cmlnaHRPd25lcj4KICAgIDxyZGY6U2VxLz4KICAgPC9wbHVzOkNvcHlyaWdodE93bmVyPgogICA8cGx1czpMaWNlbnNvcj4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgcGx1czpMaWNlbnNvclVSTD0iaHR0cHM6Ly93d3cuaXN0b2NrcGhvdG8uY29tL3Bob3RvL2xpY2Vuc2UtZ20xMTUwMzQ1MzQxLT91dG1fbWVkaXVtPW9yZ2FuaWMmYW1wO3V0bV9zb3VyY2U9Z29vZ2xlJmFtcDt1dG1fY2FtcGFpZ249aXB0Y3VybCIvPgogICAgPC9yZGY6U2VxPgogICA8L3BsdXM6TGljZW5zb3I+CiAgIDxkYzpjcmVhdG9yPgogICAgPHJkZjpTZXE+CiAgICAgPHJkZjpsaT5WbGFkeXNsYXYgU2VyZWRhPC9yZGY6bGk+CiAgICA8L3JkZjpTZXE+CiAgIDwvZGM6Y3JlYXRvcj4KICAgPGRjOmRlc2NyaXB0aW9uPgogICAgPHJkZjpBbHQ+CiAgICAgPHJkZjpsaSB4bWw6bGFuZz0ieC1kZWZhdWx0Ij5TZXJ2aWNlIHRvb2xzIGljb24gb24gd2hpdGUgYmFja2dyb3VuZC4gVmVjdG9yIGlsbHVzdHJhdGlvbi48L3JkZjpsaT4KICAgIDwvcmRmOkFsdD4KICAgPC9kYzpkZXNjcmlwdGlvbj4KICA8L3JkZjpEZXNjcmlwdGlvbj4KIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAKPD94cGFja2V0IGVuZD0idyI/PmWJCnkAAAAGYktHRAD/AP8A/6C9p5MAAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQflAg4LBR0CZnO/AAAARHRFWHRDb21tZW50AFNlcnZpY2UgdG9vbHMgaWNvbiBvbiB3aGl0ZSBiYWNrZ3JvdW5kLiBWZWN0b3IgaWxsdXN0cmF0aW9uLlwvEeIAAAMxSURBVHja7Z1bcuQwCEX7qrLQXlp2ynxNVWbK7dgWj3sl9JvYRhxACD369erW7UMzx/cYaychonAQvXM5ABYkpynoYIiEGdoQog6AYfywBrCxF4zNrX/7McBbuXJe8rXx/KBDULcGsMREzCbeZ4J6ME/9wVH5d95rogZp3npEgPLP3m2iUSGqXBJS5Dr6hmLm8kRuZABYti5TMaailV8LodNQwTTUWk4/WZk75l0kM0aZQdaZjMqkrQDAuyMVJWFjMB4GANXr0lbZBxQKr7IjI7QvVWkok/Jn5UHVh61CYPs+/i7eL9j3y/Au8WqoAIC34k8/9k7N8miLcaGWHwgjZXE/awyYX7h41wKMCskZM2HXAddDkTdglpSjz5bcKPbcCEKwT3+DhxtVpJvkEC7rZSgq32NMSBoXaCdiahDCKrND0fpX8oQlVsQ8IFQZ1VARdIF5wroekAjB07gsAgDUIbQHFENIDEX4CQANIVe8Iw/ASiACLXl28eaf579OPuBa9/mrELUYHQ1t3KHlZZnRcXb2/c7ygXIQZqjDMEzeSrOgCAhqYMvTUE+FKXoVxTxgk3DEPREjGzj3nAk/VaKyB9GVIu4oMyOlrQZgrBBEFG9PAZTfs3amYDGrP9Wl964IeFvtz9JFluIvlEvcdoXDOdxggbDxGwTXcxFRi/LdirKgZUBm7SUdJG69IwSUzAMWgOAq/4hyrZVaJISSNWHFVbEoCFEhyBrCtXS9L+so9oTy8wGqxbQDD350WTjNESVFEB5hdKzUGcV5QtYxVWR2Ssl4Mg9qI9u6FCBInJRXgfEEgtS9Cgrg7kKouq4mdcDNBnEHQvWFTdgdgsqP+MiluVeBM13ahx09AYSWi50gsF+I6vn7BmCEoHR3NBzkpIOw4+XdVBBGQUioblaZHbGlodtB+N/jxqwLX/x/NARfD8ADxTOCKIcwE4Lw0OIbguMYcGTlymEpHYLXIKx8zQEqIfS2lGJPaADFEBR/PMH79ErqtpnZmTBlvM4wgihPWDEEhXn1LISj50crNgfCp+dWHYQRCfb2zgfnBZmKGAyi914anK9Coi4LOMhoAn3uVtn+AGnLKxPUZnCuAAAAAElFTkSuQmCC';
    const img = Buffer.from(imgdata, 'base64');

    var favicon = (method, tokens, query, body) => {
        console.log('serving favicon...');
        const headers = {
            'Content-Type': 'image/png',
            'Content-Length': img.length
        };
        let result = img;

        return {
            headers,
            result
        };
    };

    var require$$0 = "<!DOCTYPE html>\r\n<html lang=\"en\">\r\n<head>\r\n    <meta charset=\"UTF-8\">\r\n    <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\r\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n    <title>SUPS Admin Panel</title>\r\n    <style>\r\n        * {\r\n            padding: 0;\r\n            margin: 0;\r\n        }\r\n\r\n        body {\r\n            padding: 32px;\r\n            font-size: 16px;\r\n        }\r\n\r\n        .layout::after {\r\n            content: '';\r\n            clear: both;\r\n            display: table;\r\n        }\r\n\r\n        .col {\r\n            display: block;\r\n            float: left;\r\n        }\r\n\r\n        p {\r\n            padding: 8px 16px;\r\n        }\r\n\r\n        table {\r\n            border-collapse: collapse;\r\n        }\r\n\r\n        caption {\r\n            font-size: 120%;\r\n            text-align: left;\r\n            padding: 4px 8px;\r\n            font-weight: bold;\r\n            background-color: #ddd;\r\n        }\r\n\r\n        table, tr, th, td {\r\n            border: 1px solid #ddd;\r\n        }\r\n\r\n        th, td {\r\n            padding: 4px 8px;\r\n        }\r\n\r\n        ul {\r\n            list-style: none;\r\n        }\r\n\r\n        .collection-list a {\r\n            display: block;\r\n            width: 120px;\r\n            padding: 4px 8px;\r\n            text-decoration: none;\r\n            color: black;\r\n            background-color: #ccc;\r\n        }\r\n        .collection-list a:hover {\r\n            background-color: #ddd;\r\n        }\r\n        .collection-list a:visited {\r\n            color: black;\r\n        }\r\n    </style>\r\n    <script type=\"module\">\nimport { html, render } from 'https://unpkg.com/lit-html@1.3.0?module';\nimport { until } from 'https://unpkg.com/lit-html@1.3.0/directives/until?module';\n\nconst api = {\r\n    async get(url) {\r\n        return json(url);\r\n    },\r\n    async post(url, body) {\r\n        return json(url, {\r\n            method: 'POST',\r\n            headers: { 'Content-Type': 'application/json' },\r\n            body: JSON.stringify(body)\r\n        });\r\n    }\r\n};\r\n\r\nasync function json(url, options) {\r\n    return await (await fetch('/' + url, options)).json();\r\n}\r\n\r\nasync function getCollections() {\r\n    return api.get('data');\r\n}\r\n\r\nasync function getRecords(collection) {\r\n    return api.get('data/' + collection);\r\n}\r\n\r\nasync function getThrottling() {\r\n    return api.get('util/throttle');\r\n}\r\n\r\nasync function setThrottling(throttle) {\r\n    return api.post('util', { throttle });\r\n}\n\nasync function collectionList(onSelect) {\r\n    const collections = await getCollections();\r\n\r\n    return html`\r\n    <ul class=\"collection-list\">\r\n        ${collections.map(collectionLi)}\r\n    </ul>`;\r\n\r\n    function collectionLi(name) {\r\n        return html`<li><a href=\"javascript:void(0)\" @click=${(ev) => onSelect(ev, name)}>${name}</a></li>`;\r\n    }\r\n}\n\nasync function recordTable(collectionName) {\r\n    const records = await getRecords(collectionName);\r\n    const layout = getLayout(records);\r\n\r\n    return html`\r\n    <table>\r\n        <caption>${collectionName}</caption>\r\n        <thead>\r\n            <tr>${layout.map(f => html`<th>${f}</th>`)}</tr>\r\n        </thead>\r\n        <tbody>\r\n            ${records.map(r => recordRow(r, layout))}\r\n        </tbody>\r\n    </table>`;\r\n}\r\n\r\nfunction getLayout(records) {\r\n    const result = new Set(['_id']);\r\n    records.forEach(r => Object.keys(r).forEach(k => result.add(k)));\r\n\r\n    return [...result.keys()];\r\n}\r\n\r\nfunction recordRow(record, layout) {\r\n    return html`\r\n    <tr>\r\n        ${layout.map(f => html`<td>${JSON.stringify(record[f]) || html`<span>(missing)</span>`}</td>`)}\r\n    </tr>`;\r\n}\n\nasync function throttlePanel(display) {\r\n    const active = await getThrottling();\r\n\r\n    return html`\r\n    <p>\r\n        Request throttling: </span>${active}</span>\r\n        <button @click=${(ev) => set(ev, true)}>Enable</button>\r\n        <button @click=${(ev) => set(ev, false)}>Disable</button>\r\n    </p>`;\r\n\r\n    async function set(ev, state) {\r\n        ev.target.disabled = true;\r\n        await setThrottling(state);\r\n        display();\r\n    }\r\n}\n\n//import page from '//unpkg.com/page/page.mjs';\r\n\r\n\r\nfunction start() {\r\n    const main = document.querySelector('main');\r\n    editor(main);\r\n}\r\n\r\nasync function editor(main) {\r\n    let list = html`<div class=\"col\">Loading&hellip;</div>`;\r\n    let viewer = html`<div class=\"col\">\r\n    <p>Select collection to view records</p>\r\n</div>`;\r\n    display();\r\n\r\n    list = html`<div class=\"col\">${await collectionList(onSelect)}</div>`;\r\n    display();\r\n\r\n    async function display() {\r\n        render(html`\r\n        <section class=\"layout\">\r\n            ${until(throttlePanel(display), html`<p>Loading</p>`)}\r\n        </section>\r\n        <section class=\"layout\">\r\n            ${list}\r\n            ${viewer}\r\n        </section>`, main);\r\n    }\r\n\r\n    async function onSelect(ev, name) {\r\n        ev.preventDefault();\r\n        viewer = html`<div class=\"col\">${await recordTable(name)}</div>`;\r\n        display();\r\n    }\r\n}\r\n\r\nstart();\n\n</script>\r\n</head>\r\n<body>\r\n    <main>\r\n        Loading&hellip;\r\n    </main>\r\n</body>\r\n</html>";

    const mode = process.argv[2] == '-dev' ? 'dev' : 'prod';

    const files = {
        index: mode == 'prod' ? require$$0 : fs__default['default'].readFileSync('./client/index.html', 'utf-8')
    };

    var admin = (method, tokens, query, body) => {
        const headers = {
            'Content-Type': 'text/html'
        };
        let result = '';

        const resource = tokens.join('/');
        if (resource && resource.split('.').pop() == 'js') {
            headers['Content-Type'] = 'application/javascript';

            files[resource] = files[resource] || fs__default['default'].readFileSync('./client/' + resource, 'utf-8');
            result = files[resource];
        } else {
            result = files.index;
        }

        return {
            headers,
            result
        };
    };

    /*
     * This service requires util plugin
     */

    const utilService = new Service_1();

    utilService.post('*', onRequest);
    utilService.get(':service', getStatus);

    function getStatus(context, tokens, query, body) {
        return context.util[context.params.service];
    }

    function onRequest(context, tokens, query, body) {
        Object.entries(body).forEach(([k,v]) => {
            console.log(`${k} ${v ? 'enabled' : 'disabled'}`);
            context.util[k] = v;
        });
        return '';
    }

    var util$1 = utilService.parseRequest;

    var services = {
        jsonstore,
        users,
        data: data$1,
        favicon,
        admin,
        util: util$1
    };

    const { uuid: uuid$2 } = util;


    function initPlugin(settings) {
        const storage = createInstance(settings.seedData);
        const protectedStorage = createInstance(settings.protectedData);

        return function decoreateContext(context, request) {
            context.storage = storage;
            context.protectedStorage = protectedStorage;
        };
    }


    /**
     * Create storage instance and populate with seed data
     * @param {Object=} seedData Associative array with data. Each property is an object with properties in format {key: value}
     */
    function createInstance(seedData = {}) {
        const collections = new Map();

        // Initialize seed data from file    
        for (let collectionName in seedData) {
            if (seedData.hasOwnProperty(collectionName)) {
                const collection = new Map();
                for (let recordId in seedData[collectionName]) {
                    if (seedData.hasOwnProperty(collectionName)) {
                        collection.set(recordId, seedData[collectionName][recordId]);
                    }
                }
                collections.set(collectionName, collection);
            }
        }


        // Manipulation

        /**
         * Get entry by ID or list of all entries from collection or list of all collections
         * @param {string=} collection Name of collection to access. Throws error if not found. If omitted, returns list of all collections.
         * @param {number|string=} id ID of requested entry. Throws error if not found. If omitted, returns of list all entries in collection.
         * @return {Object} Matching entry.
         */
        function get(collection, id) {
            if (!collection) {
                return [...collections.keys()];
            }
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!id) {
                const entries = [...targetCollection.entries()];
                let result = entries.map(([k, v]) => {
                    return Object.assign(deepCopy(v), { _id: k });
                });
                return result;
            }
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }
            const entry = targetCollection.get(id);
            return Object.assign(deepCopy(entry), { _id: id });
        }

        /**
         * Add new entry to collection. ID will be auto-generated
         * @param {string} collection Name of collection to access. If the collection does not exist, it will be created.
         * @param {Object} data Value to store.
         * @return {Object} Original value with resulting ID under _id property.
         */
        function add(collection, data) {
            const record = assignClean({ _ownerId: data._ownerId }, data);

            let targetCollection = collections.get(collection);
            if (!targetCollection) {
                targetCollection = new Map();
                collections.set(collection, targetCollection);
            }
            let id = uuid$2();
            // Make sure new ID does not match existing value
            while (targetCollection.has(id)) {
                id = uuid$2();
            }

            record._createdOn = Date.now();
            targetCollection.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }

        /**
         * Replace entry by ID
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {number|string} id ID of entry to update. Throws error if not found.
         * @param {Object} data Value to store. Record will be replaced!
         * @return {Object} Updated entry.
         */
        function set(collection, id, data) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }

            const existing = targetCollection.get(id);
            const record = assignSystemProps(deepCopy(data), existing);
            record._updatedOn = Date.now();
            targetCollection.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }

        /**
         * Modify entry by ID
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {number|string} id ID of entry to update. Throws error if not found.
         * @param {Object} data Value to store. Shallow merge will be performed!
         * @return {Object} Updated entry.
         */
         function merge(collection, id, data) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }

            const existing = deepCopy(targetCollection.get(id));
            const record = assignClean(existing, data);
            record._updatedOn = Date.now();
            targetCollection.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }

        /**
         * Delete entry by ID
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {number|string} id ID of entry to update. Throws error if not found.
         * @return {{_deletedOn: number}} Server time of deletion.
         */
        function del(collection, id) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }
            targetCollection.delete(id);

            return { _deletedOn: Date.now() };
        }

        /**
         * Search in collection by query object
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {Object} query Query object. Format {prop: value}.
         * @return {Object[]} Array of matching entries.
         */
        function query(collection, query) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            const result = [];
            // Iterate entries of target collection and compare each property with the given query
            for (let [key, entry] of [...targetCollection.entries()]) {
                let match = true;
                for (let prop in entry) {
                    if (query.hasOwnProperty(prop)) {
                        const targetValue = query[prop];
                        // Perform lowercase search, if value is string
                        if (typeof targetValue === 'string' && typeof entry[prop] === 'string') {
                            if (targetValue.toLocaleLowerCase() !== entry[prop].toLocaleLowerCase()) {
                                match = false;
                                break;
                            }
                        } else if (targetValue != entry[prop]) {
                            match = false;
                            break;
                        }
                    }
                }

                if (match) {
                    result.push(Object.assign(deepCopy(entry), { _id: key }));
                }
            }

            return result;
        }

        return { get, add, set, merge, delete: del, query };
    }


    function assignSystemProps(target, entry, ...rest) {
        const whitelist = [
            '_id',
            '_createdOn',
            '_updatedOn',
            '_ownerId'
        ];
        for (let prop of whitelist) {
            if (entry.hasOwnProperty(prop)) {
                target[prop] = deepCopy(entry[prop]);
            }
        }
        if (rest.length > 0) {
            Object.assign(target, ...rest);
        }

        return target;
    }


    function assignClean(target, entry, ...rest) {
        const blacklist = [
            '_id',
            '_createdOn',
            '_updatedOn',
            '_ownerId'
        ];
        for (let key in entry) {
            if (blacklist.includes(key) == false) {
                target[key] = deepCopy(entry[key]);
            }
        }
        if (rest.length > 0) {
            Object.assign(target, ...rest);
        }

        return target;
    }

    function deepCopy(value) {
        if (Array.isArray(value)) {
            return value.map(deepCopy);
        } else if (typeof value == 'object') {
            return [...Object.entries(value)].reduce((p, [k, v]) => Object.assign(p, { [k]: deepCopy(v) }), {});
        } else {
            return value;
        }
    }

    var storage = initPlugin;

    const { ConflictError: ConflictError$1, CredentialError: CredentialError$1, RequestError: RequestError$2 } = errors;

    function initPlugin$1(settings) {
        const identity = settings.identity;

        return function decorateContext(context, request) {
            context.auth = {
                register,
                login,
                logout
            };

            const userToken = request.headers['x-authorization'];
            if (userToken !== undefined) {
                let user;
                const session = findSessionByToken(userToken);
                if (session !== undefined) {
                    const userData = context.protectedStorage.get('users', session.userId);
                    if (userData !== undefined) {
                        console.log('Authorized as ' + userData[identity]);
                        user = userData;
                    }
                }
                if (user !== undefined) {
                    context.user = user;
                } else {
                    throw new CredentialError$1('Invalid access token');
                }
            }

            function register(body) {
                if (body.hasOwnProperty(identity) === false ||
                    body.hasOwnProperty('password') === false ||
                    body[identity].length == 0 ||
                    body.password.length == 0) {
                    throw new RequestError$2('Missing fields');
                } else if (context.protectedStorage.query('users', { [identity]: body[identity] }).length !== 0) {
                    throw new ConflictError$1(`A user with the same ${identity} already exists`);
                } else {
                    const newUser = Object.assign({}, body, {
                        [identity]: body[identity],
                        hashedPassword: hash(body.password)
                    });
                    const result = context.protectedStorage.add('users', newUser);
                    delete result.hashedPassword;

                    const session = saveSession(result._id);
                    result.accessToken = session.accessToken;

                    return result;
                }
            }

            function login(body) {
                const targetUser = context.protectedStorage.query('users', { [identity]: body[identity] });
                if (targetUser.length == 1) {
                    if (hash(body.password) === targetUser[0].hashedPassword) {
                        const result = targetUser[0];
                        delete result.hashedPassword;

                        const session = saveSession(result._id);
                        result.accessToken = session.accessToken;

                        return result;
                    } else {
                        throw new CredentialError$1('Login or password don\'t match');
                    }
                } else {
                    throw new CredentialError$1('Login or password don\'t match');
                }
            }

            function logout() {
                if (context.user !== undefined) {
                    const session = findSessionByUserId(context.user._id);
                    if (session !== undefined) {
                        context.protectedStorage.delete('sessions', session._id);
                    }
                } else {
                    throw new CredentialError$1('User session does not exist');
                }
            }

            function saveSession(userId) {
                let session = context.protectedStorage.add('sessions', { userId });
                const accessToken = hash(session._id);
                session = context.protectedStorage.set('sessions', session._id, Object.assign({ accessToken }, session));
                return session;
            }

            function findSessionByToken(userToken) {
                return context.protectedStorage.query('sessions', { accessToken: userToken })[0];
            }

            function findSessionByUserId(userId) {
                return context.protectedStorage.query('sessions', { userId })[0];
            }
        };
    }


    const secret = 'This is not a production server';

    function hash(string) {
        const hash = crypto__default['default'].createHmac('sha256', secret);
        hash.update(string);
        return hash.digest('hex');
    }

    var auth = initPlugin$1;

    function initPlugin$2(settings) {
        const util = {
            throttle: false
        };

        return function decoreateContext(context, request) {
            context.util = util;
        };
    }

    var util$2 = initPlugin$2;

    /*
     * This plugin requires auth and storage plugins
     */

    const { RequestError: RequestError$3, ConflictError: ConflictError$2, CredentialError: CredentialError$2, AuthorizationError: AuthorizationError$2 } = errors;

    function initPlugin$3(settings) {
        const actions = {
            'GET': '.read',
            'POST': '.create',
            'PUT': '.update',
            'PATCH': '.update',
            'DELETE': '.delete'
        };
        const rules = Object.assign({
            '*': {
                '.create': ['User'],
                '.update': ['Owner'],
                '.delete': ['Owner']
            }
        }, settings.rules);

        return function decorateContext(context, request) {
            // special rules (evaluated at run-time)
            const get = (collectionName, id) => {
                return context.storage.get(collectionName, id);
            };
            const isOwner = (user, object) => {
                return user._id == object._ownerId;
            };
            context.rules = {
                get,
                isOwner
            };
            const isAdmin = request.headers.hasOwnProperty('x-admin');

            context.canAccess = canAccess;

            function canAccess(data, newData) {
                const user = context.user;
                const action = actions[request.method];
                let { rule, propRules } = getRule(action, context.params.collection, data);

                if (Array.isArray(rule)) {
                    rule = checkRoles(rule, data);
                } else if (typeof rule == 'string') {
                    rule = !!(eval(rule));
                }
                if (!rule && !isAdmin) {
                    throw new CredentialError$2();
                }
                propRules.map(r => applyPropRule(action, r, user, data, newData));
            }

            function applyPropRule(action, [prop, rule], user, data, newData) {
                // NOTE: user needs to be in scope for eval to work on certain rules
                if (typeof rule == 'string') {
                    rule = !!eval(rule);
                }

                if (rule == false) {
                    if (action == '.create' || action == '.update') {
                        delete newData[prop];
                    } else if (action == '.read') {
                        delete data[prop];
                    }
                }
            }

            function checkRoles(roles, data, newData) {
                if (roles.includes('Guest')) {
                    return true;
                } else if (!context.user && !isAdmin) {
                    throw new AuthorizationError$2();
                } else if (roles.includes('User')) {
                    return true;
                } else if (context.user && roles.includes('Owner')) {
                    return context.user._id == data._ownerId;
                } else {
                    return false;
                }
            }
        };



        function getRule(action, collection, data = {}) {
            let currentRule = ruleOrDefault(true, rules['*'][action]);
            let propRules = [];

            // Top-level rules for the collection
            const collectionRules = rules[collection];
            if (collectionRules !== undefined) {
                // Top-level rule for the specific action for the collection
                currentRule = ruleOrDefault(currentRule, collectionRules[action]);

                // Prop rules
                const allPropRules = collectionRules['*'];
                if (allPropRules !== undefined) {
                    propRules = ruleOrDefault(propRules, getPropRule(allPropRules, action));
                }

                // Rules by record id 
                const recordRules = collectionRules[data._id];
                if (recordRules !== undefined) {
                    currentRule = ruleOrDefault(currentRule, recordRules[action]);
                    propRules = ruleOrDefault(propRules, getPropRule(recordRules, action));
                }
            }

            return {
                rule: currentRule,
                propRules
            };
        }

        function ruleOrDefault(current, rule) {
            return (rule === undefined || rule.length === 0) ? current : rule;
        }

        function getPropRule(record, action) {
            const props = Object
                .entries(record)
                .filter(([k]) => k[0] != '.')
                .filter(([k, v]) => v.hasOwnProperty(action))
                .map(([k, v]) => [k, v[action]]);

            return props;
        }
    }

    var rules = initPlugin$3;

    var identity = "email";
    var protectedData = {
    	users: {
    		"35c62d76-8152-4626-8712-eeb96381bea8": {
    			email: "peter@abv.bg",
    			username: "Peter",
    			hashedPassword: "83313014ed3e2391aa1332615d2f053cf5c1bfe05ca1cbcb5582443822df6eb1"
    		},
    		"847ec027-f659-4086-8032-5173e2f9c93a": {
    			email: "george@abv.bg",
    			username: "George",
    			hashedPassword: "83313014ed3e2391aa1332615d2f053cf5c1bfe05ca1cbcb5582443822df6eb1"
    		},
    		"60f0cf0b-34b0-4abd-9769-8c42f830dffc": {
    			email: "admin@abv.bg",
    			username: "Admin",
    			hashedPassword: "fac7060c3e17e6f151f247eacb2cd5ae80b8c36aedb8764e18a41bbdc16aa302"
    		}
    	},
    	sessions: {
    	}
    };
    var seedData = {
    	books: {
            "07f260f4-466c-4607-9a33-f7273b24f1b4": {
              "_ownerId": "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
              "title": "The Shining",
              "author": "Stephen King",
              "genre": "Horror",
              "price": 12.99,
              "description": "The Shining is a psychological horror novel by Stephen King. It follows Jack Torrance, an aspiring writer and recovering alcoholic who accepts a position as the off-season caretaker of the historic Overlook Hotel in the Colorado Rockies. His young son possesses psychic abilities and is able to see things from the past and future, such as the ghosts who inhabit the hotel.",
              "image": "data:image/jpeg;base64,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",
              "buy":[]
            },
            "bdabf5e9-23be-40a1-9f14-9117b6702a9d": {
              "_ownerId": "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
              "title": "IT",
              "author": "Stephen King",
              "genre": "Horror",
              "price": 14.99,
              "description": "IT is a horror novel by Stephen King. The story follows the experiences of seven children as they are terrorized by an evil entity that exploits the fears of its victims to disguise itself while hunting prey. It primarily appears in the form of Pennywise the Dancing Clown.",
              "image": "data:image/jpeg;base64,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",
              "buy":[]
        
            },
            "f859fc06-bd3e-4b86-aee0-64e5ad8b4f54": {
              "_ownerId": "847ec027-f659-4086-8032-5173e2f9c93a",
              "title": "Carrie",
              "author": "Stephen King",
              "genre": "Horror",
              "price": 9.99,
              "description": "Carrie is a novel by Stephen King. It's the story of a high school girl with telekinetic powers. She is mocked and humiliated by her classmates, and her unstable, religious mother. When a cruel prank at the prom pushes Carrie over the edge, her powers are unleashed with devastating and deadly results.",
              "image": "data:image/jpeg;base64,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",
              "buy":[]
        
            },
            "0ecdfc78-74c7-4e9b-a546-2a165aa6f1f8": {
              "_ownerId": "847ec027-f659-4086-8032-5173e2f9c93a",
              "title": "Pet Sematary",
              "author": "Stephen King",
              "genre": "Horror",
              "price": 11.99,
              "description": "Pet Sematary is a horror novel by Stephen King. It tells the story of Louis Creed, who moves his family to a rural home where they discover a mysterious burial ground hidden deep in the woods near their new home. When tragedy strikes, Louis turns to the burial ground in desperation, setting off a perilous chain reaction.",
              "image": "data:image/jpeg;base64,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",
              "buy":[]
        
            },
            "65e9f24b-1b5f-4c01-85b5-6eb0eeab8c08": {
              "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
              "title": "Misery",
              "author": "Stephen King",
              "genre": "Thriller",
              "price": 10.99,
              "description": "Misery is a psychological thriller novel by Stephen King. It's the story of a successful novelist who is rescued from a car crash by his self-proclaimed 'number one fan' and subjected to a series of horrific tortures at her isolated home.",
              "image": "data:image/jpeg;base64,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",
              "buy":[]
        
            },
            "ca3cc5a7-34f8-42cd-9327-d8f8a0e2a142": {
              "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
              "title": "The Stand",
              "author": "Stephen King",
              "genre": "Post-apocalyptic",
              "price": 13.99,
              "description": "The Stand is a post-apocalyptic horror/fantasy novel by Stephen King. After a government-created virus escapes and decimates the population, the survivors form two groups, one led by an elderly woman and the other by a dark man who represents pure evil.",
              "image": "data:image/jpeg;base64,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",
              "buy":[]
        
            }
          }
    };
    var rules$1 = {
    	users: {
    		".create": false,
    		".read": [
    			"Owner"
    		],
    		".update": false,
    		".delete": false
    	},
    	members: {
    		".update": "isOwner(user, get('teams', data.teamId))",
    		".delete": "isOwner(user, get('teams', data.teamId)) || isOwner(user, data)",
    		"*": {
    			teamId: {
    				".update": "newData.teamId = data.teamId"
    			},
    			status: {
    				".create": "newData.status = 'pending'"
    			}
    		}
    	}
    };
    var settings = {
    	identity: identity,
    	protectedData: protectedData,
    	seedData: seedData,
    	rules: rules$1
    };

    const plugins = [
        storage(settings),
        auth(settings),
        util$2(),
        rules(settings)
    ];

    const server = http__default['default'].createServer(requestHandler(plugins, services));

    const port = 3030;
    server.listen(port);
    console.log(`Server started on port ${port}. You can make requests to http://localhost:${port}/`);
    console.log(`Admin panel located at http://localhost:${port}/admin`);

    var softuniPracticeServer = {

    };

    return softuniPracticeServer;

})));
