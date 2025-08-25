const functions = require('firebase-functions');
const { AutomatedRecapService } = require('../services/recapGenerator');
const { startOfDay, endOfDay } = require('date-fns');

/**
 * Function that generates recaps for ALL users every 10 minutes
 * Saves recaps in the same format as weekly/monthly recaps
 */
exports.generateAllUsersTestRecaps = functions.runWith({ secrets: ["OPENAI_API_KEY"] }).pubsub
  .schedule('*/10 * * * *') // Every 10 minutes
  .onRun(async (context) => {
    console.log('=== Generating Test Recaps for All Users ===');
    
    try {
      const { db, admin } = require('../firebaseAdmin');
      // Log the Admin SDK project to ensure we're bound to the correct project at runtime
      try {
        console.log('Admin SDK project (runtime):', admin.app().options.projectId);
      } catch (_) {}
      const service = new AutomatedRecapService();
      
      // Get all users
      const usersSnapshot = await db.collection('users').get();
      
      if (usersSnapshot.empty) {
        console.log('No users found');
        return;
      }
      
      let totalRecapsGenerated = 0;
      
      // Process each user
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        // Get children for this user from TOP-LEVEL collection (matches data model)
        const childrenSnapshot = await db
          .collection('children')
          .where('parentId', '==', userId)
          .get();

        console.log(`User ${userId} - found ${childrenSnapshot.size} children in top-level 'children' collection`);

        // Fallback: try subcollection users/{userId}/children if top-level empty
        let effectiveChildrenSnapshot = childrenSnapshot;
        if (childrenSnapshot.empty) {
          console.log(`User ${userId} has no children in top-level 'children'. Trying users/${userId}/children subcollection...`);
          const nestedSnapshot = await db
            .collection('users')
            .doc(userId)
            .collection('children')
            .get();
          console.log(`User ${userId} - found ${nestedSnapshot.size} children in users/${userId}/children`);
          effectiveChildrenSnapshot = nestedSnapshot;
        }
        
        if (effectiveChildrenSnapshot.empty) {
          console.log(`User ${userId} has no children in either location. Skipping.`);
          continue;
        }
        
        // Process each child
        for (const childDoc of effectiveChildrenSnapshot.docs) {
          const childId = childDoc.id;

          console.log(`Generating recap for user: ${userId}, child: ${childId}`);

          // Daily recap generation for testing has been temporarily removed.
        }
      }
      
      console.log(`🎉 COMPLETE: Generated ${totalRecapsGenerated} test recaps`);
      
    } catch (error) {
      console.error('❌ CRITICAL ERROR:', error);
    }
  });
