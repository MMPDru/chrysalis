// Migration script to transfer data from one user to another
// Run with: node scripts/migrate-user-data.js

const admin = require('firebase-admin');

// Initialize with service account or default credentials
admin.initializeApp({
    projectId: 'chrysalis-app-10581'
});

const db = admin.firestore();

// Source and destination user IDs - get these from Firebase Console
const SOURCE_EMAIL = 'test+verify@example.com';
const DEST_EMAIL = 'd.pio@pbizi.com';

// You'll need to look up the UIDs in Firebase Console:
// Go to Authentication > Users and find both emails, copy their User UID
const SOURCE_UID = process.env.SOURCE_UID || 'PUT_SOURCE_UID_HERE';
const DEST_UID = process.env.DEST_UID || 'PUT_DEST_UID_HERE';

async function migrateCollection(collectionName, userIdField = 'userId') {
    console.log(`\nMigrating ${collectionName}...`);

    const snapshot = await db.collection(collectionName)
        .where(userIdField, '==', SOURCE_UID)
        .get();

    console.log(`Found ${snapshot.size} documents in ${collectionName}`);

    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { [userIdField]: DEST_UID });
        count++;
    });

    if (count > 0) {
        await batch.commit();
        console.log(`Updated ${count} documents in ${collectionName}`);
    }

    return count;
}

async function migrate() {
    if (SOURCE_UID === 'PUT_SOURCE_UID_HERE' || DEST_UID === 'PUT_DEST_UID_HERE') {
        console.error('Please set SOURCE_UID and DEST_UID environment variables or edit this script.');
        console.log('\nTo find the UIDs:');
        console.log('1. Go to Firebase Console > Authentication > Users');
        console.log('2. Find test+verify@example.com and copy its User UID');
        console.log('3. Find d.pio@pbizi.com and copy its User UID');
        console.log('\nThen run: SOURCE_UID=xxx DEST_UID=yyy node scripts/migrate-user-data.js');
        process.exit(1);
    }

    console.log('Starting migration...');
    console.log(`From: ${SOURCE_EMAIL} (${SOURCE_UID})`);
    console.log(`To: ${DEST_EMAIL} (${DEST_UID})`);

    try {
        // Migrate all user-related collections
        await migrateCollection('chapters');
        await migrateCollection('versions');
        await migrateCollection('visualAssets');
        await migrateCollection('wisdomLibrary');
        await migrateCollection('tiktokScripts');

        console.log('\n✅ Migration complete!');

    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

migrate();
