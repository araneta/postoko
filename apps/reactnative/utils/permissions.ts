import { Platform, PermissionsAndroid, Permission, PermissionStatus } from 'react-native'
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export function createAction<T>(type: string, payload: T): { type: string; payload: T } {
    return {
        type,
        payload,
    };
}
export function numberFormat(number: number | string): number | string {
    if (isNaN(Number(number))) {
        return 0;
    }
    if (Number(number) === 0) {
        return 0;
    }
    return number.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
}
export function phoneFormat(number: string): string {
    let phoneNumber = number.replace(/\D/g, "").toString();
    if (phoneNumber.startsWith("62")) {
        phoneNumber = "0" + phoneNumber.toString().slice(2, phoneNumber.length);
    }
    return phoneNumber;
}

export function getDeepLink(path = '') {
    const scheme = 'sayapeduli'
    const prefix = Platform.OS == 'android' ? `${scheme}://` : `${scheme}://`
    return prefix + path
}
export async function GetAllPermissionStorages(): Promise<boolean> {
    try {
        if (Platform.OS === "android") {
            if (Platform.Version < 23) return true;
            console.log('permission', Platform.Version)
            const permissions: Permission[] = []
            if (Platform.Version < 33) {
                permissions.push(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE as Permission);
                permissions.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE as Permission);
            }
            if (Platform.Version > 32) {
                permissions.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES as Permission);
            }
            if (permissions.length > 0) {
                const status = await PermissionsAndroid.requestMultiple(permissions);
                console.log("permissionsList: ", JSON.stringify(status))
                return Object.keys(status).every(
                    (key) => status[key as keyof typeof status] === PermissionsAndroid.RESULTS.GRANTED
                );
            }
        }
        return false;
    } catch (err) {
        console.log("error getPermission", err)
        return false;
    }
}
export async function GetAllPermissionCamera(): Promise<boolean> {
    try {
        if (Platform.OS === "android") {
            if (Platform.Version < 23) return true;
            const permissions: Permission[] = []
            if (Platform.Version < 33) {
                permissions.push(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE as Permission);
                permissions.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE as Permission);
                permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA as Permission);
            }
            if (Platform.Version > 32) {
                permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA as Permission);
            }
            if (permissions.length > 0) {
                const status = await PermissionsAndroid.requestMultiple(permissions);
                console.log("permissionsList: ", JSON.stringify(status))
                return Object.keys(status).every(
                    (key) => status[key as keyof typeof status] === PermissionsAndroid.RESULTS.GRANTED
                );
            }
        }
        return false;
    } catch (err) {
        console.log("error getPermission", err)
        return false;
    }
}
export async function GetAllPermissionPrint(): Promise<boolean> {
    try {
        if (Platform.OS === "android") {
            if (Platform.Version < 23) return true;
            const permissions: Permission[] = [];
            if (Platform.Version >= 31) {
                permissions.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN as Permission);
                permissions.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT as Permission);
            } else if (Platform.Version >= 29 && Platform.Version <= 30) {
                permissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION as Permission);
            } else {
                permissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION as Permission);
            }
            if (permissions.length > 0) {
                const status = await PermissionsAndroid.requestMultiple(permissions);
                console.log("permissionsList: ", JSON.stringify(permissions))
                return Object.keys(status).every(
                    (key) => status[key as keyof typeof status] === PermissionsAndroid.RESULTS.GRANTED
                );
            }
            return true;
        }
        return false;
    } catch (err) {
        console.log("error getPermission", err)
        return false;
    }
}
interface ErrorResponse {
    response?: {
        data?: {
            meta?: {
                message?: string;
            };
            error?: string[];
            message?: string;
        };
    };
    message?: string;
}
export function getErrorMessage(error: ErrorResponse): string {
    console.log('error', JSON.stringify(error))
    if (error?.response?.data?.meta) {
        if (error?.response?.data?.meta?.message === "The Credentials are Incorrect.") {
            return "No. HP atau Password Salah."
        }
        if (error?.response?.data?.meta?.message === "Validation Error.") {
            return error?.response?.data?.error?.[0] ?? "Terjadi Kesalahan (500)."
        }
        return error?.response?.data?.meta?.message ?? "Terjadi Kesalahan (500)."
    }
    if (error?.response?.data?.message) {
        return error?.response?.data?.message ?? "Terjadi Kesalahan (500)."
    }
    return error?.message ?? "Terjadi Kesalahan (500)."
}
