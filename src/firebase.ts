import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue as FV } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });

export const firestore = getFirestore();
export const FieldValue = FV;
