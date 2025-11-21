import { db } from "./firebase-config.js";
import {
    doc, setDoc, addDoc, updateDoc, deleteDoc,
    collection, query, where, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const APP_ID = 'social-media-tracker-app';

// --- Global Settings ---
export const subscribeToGlobalSettings = (userId, callback) => {
    const ref = doc(db, `artifacts/${APP_ID}/users/${userId}/settings/globalSettings`);
    return onSnapshot(ref, (snap) => {
        if (snap.exists()) callback(snap.data().rate || 255);
        else {
            setDoc(ref, { rate: 255 }, { merge: true });
            callback(255);
        }
    });
};

export const updateGlobalRate = async (userId, rate) => {
    const ref = doc(db, `artifacts/${APP_ID}/users/${userId}/settings/globalSettings`);
    await setDoc(ref, { rate: Number(rate) }, { merge: true });
};

// --- Platforms ---
export const subscribeToPlatforms = (userId, callback) => {
    const q = query(
        collection(db, `artifacts/${APP_ID}/users/${userId}/platforms`),
        where("isDeleted", "==", false),
        orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snapshot) => {
        const platforms = [];
        snapshot.forEach(doc => platforms.push({ id: doc.id, ...doc.data() }));
        callback(platforms);
    });
};

export const addPlatform = async (userId, name) => {
    const col = collection(db, `artifacts/${APP_ID}/users/${userId}/platforms`);
    return await addDoc(col, {
        name,
        provider: 'Secsers',
        platform: name,
        createdAt: Date.now(),
        isDeleted: false
    });
};

export const deletePlatform = async (userId, platformId) => {
    const ref = doc(db, `artifacts/${APP_ID}/users/${userId}/platforms`, platformId);
    await deleteDoc(ref);
};

export const updatePlatformSettings = async (userId, platformId, data) => {
    const ref = doc(db, `artifacts/${APP_ID}/users/${userId}/platforms`, platformId);
    await updateDoc(ref, data);
};

export const getPlatformDetails = (userId, platformId, callback) => {
    const ref = doc(db, `artifacts/${APP_ID}/users/${userId}/platforms`, platformId);
    return onSnapshot(ref, (snap) => {
        if (snap.exists()) callback(snap.data());
    });
};

// --- Trackers (Service Types) ---
export const subscribeToTrackers = (userId, platformId, callback) => {
    const q = query(
        collection(db, `artifacts/${APP_ID}/users/${userId}/platforms/${platformId}/trackers`),
        where("isDeleted", "==", false),
        orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snapshot) => {
        const trackers = [];
        snapshot.forEach(doc => trackers.push({ id: doc.id, ...doc.data() }));
        callback(trackers);
    });
};

export const addTracker = async (userId, platformId, name) => {
    const col = collection(db, `artifacts/${APP_ID}/users/${userId}/platforms/${platformId}/trackers`);
    return await addDoc(col, { name, createdAt: Date.now(), isDeleted: false });
};

export const deleteTracker = async (userId, platformId, trackerId) => {
    const ref = doc(db, `artifacts/${APP_ID}/users/${userId}/platforms/${platformId}/trackers`, trackerId);
    await deleteDoc(ref);
};

// --- Items ---
export const subscribeToItems = (userId, platformId, trackerId, callback) => {
    const q = query(
        collection(db, `artifacts/${APP_ID}/users/${userId}/platforms/${platformId}/trackers/${trackerId}/items`),
        where("isDeleted", "==", false),
        orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snapshot) => {
        const items = [];
        snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
        callback(items);
    });
};

export const addItem = async (userId, platformId, trackerId, isDefault = false) => {
    const data = isDefault
        ? { id: '101', cat: 'General', service: '1k Followers', buyUSD: 1, sellDA: 500, qty: 1 }
        : { id: '', cat: '', service: 'New Item', buyUSD: 0, sellDA: 0, qty: 1 };

    const col = collection(db, `artifacts/${APP_ID}/users/${userId}/platforms/${platformId}/trackers/${trackerId}/items`);
    await addDoc(col, { ...data, createdAt: Date.now(), isDeleted: false });
};

export const updateItem = async (userId, platformId, trackerId, itemId, field, value) => {
    const ref = doc(db, `artifacts/${APP_ID}/users/${userId}/platforms/${platformId}/trackers/${trackerId}/items`, itemId);
    const numFields = ['buyUSD', 'sellDA', 'qty'];
    const val = numFields.includes(field) ? Number(value) : value;
    await updateDoc(ref, { [field]: val });
};

export const deleteItem = async (userId, platformId, trackerId, itemId) => {
    const ref = doc(db, `artifacts/${APP_ID}/users/${userId}/platforms/${platformId}/trackers/${trackerId}/items`, itemId);
    await deleteDoc(ref);
};
