import { ApiError } from "./types.js";

export class UnwrapFailure extends Error {
    constructor(message: string) {
        super(message);
        this.name = "UnwrapFailure";
    }
}

export class ApiResponse<
    Success extends object,
    Err extends ApiError<any, any, any> = ApiError<string, string, number>
> {
    constructor(public response: object) {}

    isErr() {
        return (
            "message" in this.response &&
            "error" in this.response &&
            "statusCode" in this.response &&
            "timestamp" in this.response &&
            "type" in this.response &&
            this.response.type === "error"
        );
    }

    err(): Err | null {
        return this.isErr() ? (this.response as Err) : null;
    }

    ok(): Success | null {
        return !this.isErr() ? (this.response as Success) : null;
    }

    transpose() {
        // they can not be both null, so I use this "as" shit
        return [this.ok(), this.err()] as [Success, null] | [null, Err];
    }
}
