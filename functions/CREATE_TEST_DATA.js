// Create test data to trigger recap generation
const admin = require('firebase-admin');

// Initialize if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function createTestData() {
  console.log('🎯 Creating test data for recap generation...\n');

  const userId = 'testUser123';
  const childId = 'child456';
  const childName = 'Emma';

  try {
    // 1. Create test child
    console.log('1. Creating test child...');
    const childRef = await db.collection('children').add({
      userId: userId,
      name: childName,
      birthDate: new Date('2023-01-15'),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`   ✅ Child created: ${childRef.id}`);

    // 2. Create test journal entries (need at least 2-3 for recap)
    const entries = [
      {
        userId: userId,
        childIds: [childRef.id],
        content: `Today ${childName} took her first steps! So amazing to see her wobble across the living room. She was so proud of herself!`,
        createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
        isMilestone: true,
        isFavorited: true,
        media: [],
        tags: ['milestone', 'first-steps']
      },
      {
        userId: userId,
        childIds: [childRef.id],
        content: `${childName} laughed so hard at dinner tonight when daddy made silly faces. Her giggle is absolutely infectious!`,
        createdAt: new Date(Date.now() - 86400000), // Yesterday
        isMilestone: false,
        isFavorited: true,
        media: [],
        tags: ['laughter', 'dinner']
      },
      {
        userId: userId,
        childIds: [childRef.id],
        content: `Emma discovered her shadow today and kept trying to catch it. The look of wonder on her face was priceless!`,
        createdAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
        isMilestone: false,
        isFavorited: false,
        media: [],
        tags: ['discovery', 'shadow']
      }
    ];

    console.log('2. Creating test journal entries...');
    for (const entry of entries) {
      const entryRef = await db.collection('journalEntries').add(entry);
      console.log(`   ✅ Entry created: ${entryRef.id}`);
    }

    console.log('\n🎉 Test data created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Create Firestore indexes (see TROUBLESHOOT_NO_RECAPS.md)');
    console.log('2. Wait for indexes to build (5-10 minutes)');
    console.log('3. Trigger daily recap manually or wait for schedule');
    console.log(`4. Check recaps collection for user: ${userId}, child: ${childRef.id}`);

    return {
      userId: userId,
      childId: childRef.id,
      success: true
    };

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createTestData()
    .then(result => {
      console.log('\n✅ Ready to test recap generation!');
      console.log(`   User ID: ${result.userId}`);
      console.log(`   Child ID: ${result.childId}`);
    })
    .catch(console.error);
}

module.exports = { createTestData };
