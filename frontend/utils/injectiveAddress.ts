import { getInjectiveAddress } from "@injectivelabs/sdk-ts";

export const toInjectiveAddress = (evmAddress: string): string => {
  try {
    if (evmAddress.startsWith("inj")) return evmAddress;
    return getInjectiveAddress(evmAddress);
  } catch {
    return evmAddress;
  }
};
