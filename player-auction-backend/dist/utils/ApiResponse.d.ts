export declare class ApiResponse<T = unknown> {
    readonly success: true;
    readonly message: string;
    readonly data?: T;
    constructor(message: string, data?: T);
}
