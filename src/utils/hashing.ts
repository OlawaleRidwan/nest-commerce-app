import * as crypto from 'crypto';
import {hash, compare} from 'bcrypt';
export const doHash = (value:string,saltValue: number) => {
    const result = hash(value, saltValue)
    return result;
}

export const doHashValidation = (value:string,hashedValue: string) => {
    const result = compare(value,hashedValue);
    return result;
}

export function hmacProcess(code: string): string {
  return crypto
    .createHmac('sha256', process.env.HMAC_VERIFICATION_CODE_SECRET as string)
    .update(code)
    .digest('hex');
}

