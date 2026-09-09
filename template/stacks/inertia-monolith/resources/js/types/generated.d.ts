declare namespace App {
namespace Data {
namespace Users {
export type AccountData = {
name: string,
email: string,
verified: boolean,
authenticatorPending: boolean,
authenticatorConfirmed: boolean,
passkeyCount: number,
};
export type AuthCapabilitiesData = {
registrationEnabled: boolean,
registrationUrl: string | null,
};
export type PasskeyData = {
id: string,
name: string,
createdAt: string | null,
lastUsedAt: string | null,
};
}
}
}
