import { subtle } from "crypto";
import { TextEncoder, TextDecoder } from 'node:util'

const encode = new TextEncoder();
const decoder = new TextDecoder();

const key: CryptoKey = await subtle.generateKey(
    {
        name: "AES-GCM",
        length: 256, // 256 bits AES key
    },
    true, // Whether the key can be exported
    ["encrypt", "decrypt"]
);


export async function encryptString(string: string) {
    const iv:Uint8Array<ArrayBuffer> = crypto.getRandomValues(new Uint8Array(12));
    const encodedData:Uint8Array = encode.encode(string);

    const encryptedData = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        encodedData
    );

    return {
        encryptedData: arrayBufferToBase64(new Uint8Array(encryptedData)),
        iv: arrayBufferToBase64(iv),
    };
}

export async function decryptString(encryptedData: string, iv:string): Promise<string> {
    const decryptedData = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: base64ToArrayBuffer(iv),
        },
        key,
        base64ToArrayBuffer(encryptedData)
    );

    return decoder.decode(decryptedData);
}

function arrayBufferToBase64(buffer: Uint8Array<ArrayBuffer>) {
    const uint8Array = new Uint8Array(buffer);
    return btoa(String.fromCharCode(...uint8Array));
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}